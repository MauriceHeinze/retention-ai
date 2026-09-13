import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createDemoRunner } from "./demo.js";
import { createJobQueue, jobId } from "./jobs.js";
import { customers, release } from "./fixtures.js";
import { getDeploymentJob } from "./github.js";
import { githubDeploymentFixture } from "./github-fixtures.js";
import { createDemoEmailer } from "./email.js";
import { createWebhookServer } from "./webhook.js";

test("persist a deployment result, remove private fields, and restore it for approved delivery", async t => {
  const directory = await mkdtemp(join(tmpdir(), "retentionai-deployment-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const demo = createDemoRunner(async () => { throw new Error("fixture run is not used"); });
  const job = getDeploymentJob(githubDeploymentFixture, githubDeploymentFixture.repository.full_name)!;
  const customer = { ...customers[0]!, email: "private@example.com", subscriptionId: "private-subscription" };
  const queue = await createJobQueue(directory, async () => demo.publishDeployment(jobId(job), release, [customer], {
    assessment: { decisions: [{ customerId: customer.id, decision: "match", reason: "CSV downloads are available",
      customerEvidence: customer.feedback, releaseEvidence: release.evidence,
      draft: { subject: "CSV downloads", body: "Manual CSV downloads are available." },
    }] }, steps: 2, tools: ["readRelease", "readCancellationFeedback"], excludedCustomers: 0,
  }));
  await queue.enqueue(job);
  await queue.idle();
  const saved = await readFile(join(directory, `${jobId(job)}.json`), "utf8");
  assert.equal(saved.includes("private@example.com"), false);
  assert.equal(saved.includes("private-subscription"), false);
  const restartedQueue = await createJobQueue(directory, async () => { throw new Error("must not rerun completed deployment"); });
  const restored = createDemoRunner(async () => { throw new Error("fixture run is not used"); });
  for (const run of restartedQueue.completedRuns()) restored.restoreDeployment(run);
  assert.equal(restored.deployments()[0]?.id, jobId(job));
  assert.equal(restored.get(jobId(job))?.sources.customers, "stripe_sandbox");
  assert.equal((await restartedQueue.enqueue(job)).duplicate, true);
  const send = createDemoEmailer(restored, async () => "test-message-id", { log: () => {} });
  assert.equal((await send(jobId(job), customer.id)).status, "accepted");
});

test("deployment polling exposes progress and failures before an assessment is available", async t => {
  const demo = createDemoRunner(async () => { throw new Error("not used"); });
  const server = createWebhookServer({ demo, deploymentStatus: id => ({ pending: "queued", failed: "failed", skipped: "completed" })[id] });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); }));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api/demo`;
  assert.deepEqual(await (await fetch(`${base}/deployments`)).json(), { runs: [] });
  assert.equal((await (await fetch(`${base}/runs/pending`)).json()).status, "running");
  assert.equal((await (await fetch(`${base}/runs/failed`)).json()).status, "failed");
  assert.ok((await (await fetch(`${base}/runs/skipped`)).json()).error.includes("no reviewable"));
});
