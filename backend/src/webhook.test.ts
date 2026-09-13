import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createWebhookServer, verifySignature } from "./webhook.js";
import { createJobQueue, jobId } from "./jobs.js";
import { getDeploymentJob } from "./github.js";
import { githubDeploymentFixture as event } from "./github-fixtures.js";

const secret = "local-test-secret-that-is-not-a-real-credential";
const repository = event.repository.full_name;
const job = getDeploymentJob(event, repository)!;
const sign = (body: string) => `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

test("verify the raw body and reject missing or modified signatures", () => {
  const body = JSON.stringify(event);
  assert.equal(verifySignature(Buffer.from(body), sign(body), secret), true);
  assert.equal(verifySignature(Buffer.from(body + " "), sign(body), secret), false);
  assert.equal(verifySignature(Buffer.from(body), undefined, secret), false);
  assert.equal(verifySignature(Buffer.from(body), "sha256=bad", secret), false);
});

test("HTTP receiver verifies signatures, filters events, and rejects invalid requests", async t => {
  let queued = 0;
  const server = createWebhookServer({ secret, repository, enqueue: async () => ({ id: "test-job", duplicate: ++queued > 1 }) });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); }));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/webhooks/github`;
  async function send(payload: unknown, type = "deployment_status", validSignature = true) {
    const body = typeof payload === "string" ? payload : JSON.stringify(payload);
    return fetch(url, { method: "POST", headers: {
      "Content-Type": "application/json", "X-GitHub-Event": type,
      "X-Hub-Signature-256": validSignature ? sign(body) : "invalid",
    }, body });
  }
  assert.equal((await send(event, "deployment_status", false)).status, 401);
  assert.equal((await send("invalid-json")).status, 400);
  assert.equal((await send({ ...event, repository: { full_name: "other/repo" } })).status, 403);
  assert.equal((await send({}, "ping")).status, 200);
  assert.equal((await send(event, "push")).status, 202);
  assert.equal((await send({ ...event, deployment_status: { state: "failure", environment: "production" } })).status, 202);
  assert.equal(queued, 0);
  const accepted = await send(event);
  assert.equal(accepted.status, 202);
  assert.equal((await accepted.json()).status, "queued");
  assert.equal((await (await send(event)).json()).status, "duplicate");
  assert.equal((await fetch(url)).status, 405);
  assert.equal((await fetch(url, { method: "POST", body: "text" })).status, 415);
  const large = await send("x".repeat(256 * 1024 + 1));
  assert.equal(large.status, 413);
});

test("rate limit requests before parsing or queueing", async t => {
  const server = createWebhookServer({ secret, repository, requestsPerMinute: 1, enqueue: async () => { throw new Error("must not queue"); } });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); }));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/healthz`;
  assert.equal((await fetch(url)).status, 200);
  assert.equal((await fetch(url)).status, 429);
});

test("queue deduplicates concurrent deliveries and preserves completion across restarts", async t => {
  const directory = await mkdtemp(join(tmpdir(), "retentionai-jobs-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let processed = 0;
  const queue = await createJobQueue(directory, async () => { processed++; });
  const deliveries = await Promise.all([queue.enqueue(job), queue.enqueue(job)]);
  await queue.idle();
  assert.equal(processed, 1);
  assert.equal(deliveries.filter(delivery => delivery.duplicate).length, 1);
  const restarted = await createJobQueue(directory, async () => { processed++; });
  assert.equal((await restarted.enqueue({ ...job, deploymentId: 99 })).duplicate, true);
  await restarted.idle();
  assert.equal(processed, 1);
});

test("recover interrupted work and allow failed work to retry on redelivery", async t => {
  const directory = await mkdtemp(join(tmpdir(), "retentionai-retry-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, `${jobId(job)}.json`), JSON.stringify({ job, status: "running" }));
  let attempts = 0;
  const queue = await createJobQueue(directory, async () => { if (++attempts === 1) throw new Error("temporary failure"); });
  await queue.idle();
  assert.equal(queue.getStatus(jobId(job)), "failed");
  assert.equal((await queue.enqueue(job)).duplicate, false);
  await queue.idle();
  assert.equal(queue.getStatus(jobId(job)), "completed");
  assert.equal(attempts, 2);
});
