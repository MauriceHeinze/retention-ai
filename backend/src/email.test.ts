import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { createDemoRunner, type DemoRun } from "./demo.js";
import { createDemoEmailer, createResendSender } from "./email.js";
import { createWebhookServer } from "./webhook.js";
import { customers, release } from "./fixtures.js";

const customerId = "customer-manual-csv";
const result: NonNullable<DemoRun["result"]> = {
  assessment: { decisions: [{
    customerId, decision: "match", reason: "CSV is available",
    customerEvidence: customers[0]!.feedback, releaseEvidence: release.evidence,
    draft: { subject: "CSV export is here", body: "You can now download reports as CSV files." },
  }] },
  steps: 2, tools: ["readRelease", "readCancellationFeedback"], excludedCustomers: 1,
};
const quiet = { log: () => {} };

test("Resend uses the fixed inbox, plain text and stable idempotency headers", async () => {
  const sender = createResendSender("test-key", "owner@example.com", async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(options?.redirect, "error");
    assert.ok(options?.signal);
    const headers = new Headers(options?.headers);
    assert.equal(headers.get("authorization"), "Bearer test-key");
    assert.equal(headers.get("idempotency-key"), "stable-key");
    assert.equal(headers.get("user-agent"), "Node.js");
    const body = JSON.parse(String(options?.body));
    assert.deepEqual(body.to, ["owner@example.com"]);
    assert.equal(body.from, "RetentionAI Demo <onboarding@resend.dev>");
    assert.equal(body.subject, "[RetentionAI demo] CSV export is here");
    assert.equal("html" in body, false);
    assert.ok(body.text.includes("sample customer data"));
    return Response.json({ id: "email-id" });
  });
  assert.equal(await sender(result.assessment.decisions[0]!.draft!, "stable-key"), "email-id");
  assert.throws(() => createResendSender("key", "not an email"));
});

test("Resend failures never expose keys, recipient or provider response bodies", async () => {
  const failures: typeof fetch[] = [
    async () => new Response("private provider body", { status: 403 }),
    async () => Response.json({ unexpected: "private provider body" }),
    async () => { throw new Error("private provider body"); },
  ];
  for (const fetcher of failures) {
    await assert.rejects(createResendSender("test-key", "owner@example.com", fetcher)({ subject: "Test", body: "Test" }, "key"), error => {
      assert.ok(error instanceof Error);
      assert.equal(error.message.includes("private"), false);
      assert.equal(error.message.includes("owner@example.com"), false);
      return true;
    });
  }
});

test("approval deduplicates concurrent requests and refuses opt-outs and incomplete runs", async () => {
  let calls = 0;
  const demo = createDemoRunner(async () => structuredClone(result), quiet);
  const run = demo.start()!.run;
  const send = createDemoEmailer(demo, async () => { calls++; await setImmediate(); return "email-id"; }, quiet);
  await assert.rejects(send(run.id, customerId), { status: 409 });
  await setImmediate();
  await assert.rejects(send("unknown", customerId), { status: 404 });
  await assert.rejects(send(run.id, "customer-price"), { status: 409 });
  await assert.rejects(send(run.id, "customer-opted-out"), { status: 409 });
  run.customers[0]!.marketingConsent = false;
  await assert.rejects(send(run.id, customerId), { status: 409 });
  run.customers[0]!.marketingConsent = true;
  const sent = await Promise.all([send(run.id, customerId), send(run.id, customerId)]);
  assert.equal(calls, 1);
  assert.equal(sent[0]!.status, "accepted");
  assert.equal(sent[1]!.reused, true);
  assert.equal((await send(run.id, customerId)).reused, true);
  assert.equal(calls, 1);
  assert.equal(demo.get(run.id)?.deliveries?.[customerId]?.messageId, "email-id");
});

test("uncertain sends reuse the same key and enforce an attempt budget", async () => {
  const demo = createDemoRunner(async () => structuredClone(result), quiet);
  const run = demo.start()!.run;
  await setImmediate();
  const keys: string[] = [];
  const send = createDemoEmailer(demo, async (_draft, key) => { keys.push(key); throw new Error("private error"); }, { ...quiet, maxAttemptsPerHour: 2 });
  await assert.rejects(send(run.id, customerId), { status: 503 });
  await assert.rejects(send(run.id, customerId), { status: 503 });
  assert.equal(keys[0], keys[1]);
  assert.equal(run.deliveries?.[customerId]?.status, "failed");
  await assert.rejects(send(run.id, customerId), { status: 429 });
  assert.equal(keys.length, 2);
});

test("expired runs cannot send after the provider idempotency window", async () => {
  let now = 0;
  const demo = createDemoRunner(async () => structuredClone(result), { ...quiet, now: () => now });
  const run = demo.start()!.run;
  await setImmediate();
  const send = createDemoEmailer(demo, async () => { throw new Error("must not send"); }, { ...quiet, now: () => now });
  now = 24 * 3_600_000;
  await assert.rejects(send(run.id, customerId), { status: 409 });
});

test("HTTP send requires approval and rejects recipient or draft overrides", async t => {
  let calls = 0;
  const demo = createDemoRunner(async () => structuredClone(result), quiet);
  const run = demo.start()!.run;
  await setImmediate();
  const sendDemoEmail = createDemoEmailer(demo, async () => { calls++; return "email-id"; }, quiet);
  const server = createWebhookServer({ demo, sendDemoEmail, allowedOrigins: ["http://localhost:5173"] });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); }));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/api/demo/runs/${run.id}/send`;
  const headers = { "Content-Type": "application/json", Origin: "http://localhost:5173" };
  const post = (body: object) => fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  for (const body of [{ customerId }, { customerId, approved: false }, { customerId, approved: true, to: "other@example.com" }, { customerId, approved: true, subject: "override" }]) {
    assert.equal((await post(body)).status, 400);
  }
  assert.equal((await fetch(url)).status, 405);
  assert.equal((await post({ customerId: "customer-price", approved: true })).status, 409);
  assert.equal(calls, 0);
  assert.equal((await post({ customerId, approved: true })).status, 200);
  assert.equal((await (await post({ customerId, approved: true })).json()).reused, true);
  assert.equal(calls, 1);
});
