import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { createDemoRunner } from "./demo.js";
import { createWebhookServer } from "./webhook.js";
import type { DemoRun } from "./demo.js";

const result = {
  assessment: { decisions: [] }, steps: 2, tools: ["readRelease", "readCancellationFeedback"],
  excludedCustomers: 1,
} satisfies NonNullable<DemoRun["result"]>;

test("share concurrent runs, cache completion, and cap provider calls", async () => {
  let now = 0;
  let calls = 0;
  const runner = createDemoRunner(async () => { calls++; return result; }, { now: () => now, maxRunsPerHour: 1, log: () => {} });
  const first = runner.start()!;
  const duplicate = runner.start()!;
  assert.equal(first.run.status, "running");
  assert.equal(duplicate.run.id, first.run.id);
  assert.equal(duplicate.reused, true);
  await setImmediate();
  assert.equal(calls, 1);
  assert.equal(runner.get(first.run.id)?.status, "completed");
  assert.equal(runner.get(first.run.id)?.sources.assessment, "live_model");
  assert.equal("usage" in runner.get(first.run.id)!.result!, false);
  assert.equal(runner.start()!.reused, true);
  now = 10 * 60_000;
  assert.equal(runner.start(), null);
  now = 3_600_000;
  assert.notEqual(runner.start()!.run.id, first.run.id);
  await setImmediate();
  assert.equal(calls, 2);
});

test("failed model calls return safe errors and retry only after a cooldown", async () => {
  let now = 0;
  let calls = 0;
  const events: object[] = [];
  const runner = createDemoRunner(async () => {
    if (++calls === 1) throw new Error("private provider response");
    return result;
  }, { now: () => now, log: event => events.push(event) });
  const first = runner.start()!;
  await setImmediate();
  assert.equal(first.run.status, "failed");
  assert.equal(runner.start()!.run.id, first.run.id);
  assert.equal(JSON.stringify([first.run, events]).includes("private provider response"), false);
  now = 30_000;
  assert.equal(runner.start()!.reused, false);
  await setImmediate();
  assert.equal(calls, 2);
});

test("HTTP demo supports browser preflight and polling, and rejects arbitrary data and origins", async t => {
  let calls = 0;
  const demo = createDemoRunner(async () => { calls++; return result; }, { log: () => {} });
  const origin = "http://localhost:5173";
  const server = createWebhookServer({ demo, allowedOrigins: [origin] });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); }));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const url = `${base}/api/demo/runs`;
  const headers = { "Content-Type": "application/json", Origin: origin };
  const preflight = await fetch(url, { method: "OPTIONS", headers });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), origin);
  assert.equal((await fetch(url, { method: "POST", headers: { ...headers, Origin: "https://untrusted.example" }, body: "{}" })).status, 403);
  assert.equal((await fetch(url, { method: "POST", body: "{}" })).status, 415);
  for (const body of ["[]", "null", "bad JSON", '{"prompt":"arbitrary input"}']) {
    assert.equal((await fetch(url, { method: "POST", headers, body })).status, 400);
  }
  assert.equal((await fetch(url, { method: "POST", headers, body: "x".repeat(1025) })).status, 413);
  assert.equal(calls, 0);
  const started = await fetch(url, { method: "POST", headers, body: "{}" });
  assert.equal(started.status, 202);
  const run = await started.json();
  const polled = await fetch(`${url}/${run.id}`, { headers: { Origin: origin } });
  assert.equal(polled.status, 200);
  assert.equal((await polled.json()).status, "completed");
  assert.equal((await fetch(`${url}/unknown`)).status, 404);
  assert.equal((await fetch(url)).status, 405);
  assert.equal((await fetch(`${base}/webhooks/github`, { method: "POST" })).status, 503);
  assert.equal(calls, 1);
});

test("missing provider configuration gives a clear 503 without breaking health checks", async t => {
  const server = createWebhookServer({});
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); }));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  assert.equal((await fetch(`${base}/healthz`)).status, 200);
  assert.equal((await fetch(`${base}/api/demo/runs`, { method: "POST" })).status, 503);
});
