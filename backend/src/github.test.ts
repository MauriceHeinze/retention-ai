import assert from "node:assert/strict";
import { test } from "node:test";
import { getDeploymentJob, readGitHubRelease, releaseFromComparison } from "./github.js";
import { githubComparisonFixture as comparison, githubDeploymentFixture as event } from "./github-fixtures.js";

const repository = event.repository.full_name;
const job = getDeploymentJob(event, repository)!;

test("only accept the configured repository and successful production status", () => {
  assert.equal(job.sha, event.deployment.sha);
  assert.throws(() => getDeploymentJob(event, "different/repository"));
  for (const state of ["pending", "failure", "error", "inactive"]) {
    assert.equal(getDeploymentJob({ ...event, deployment_status: { ...event.deployment_status, state } }, repository), null);
  }
  assert.equal(getDeploymentJob({ ...event, deployment_status: { ...event.deployment_status, environment: "staging" } }, repository), null);
  assert.equal(getDeploymentJob({ ...event, deployment: { ...event.deployment, production_environment: false } }, repository), null);
  assert.throws(() => getDeploymentJob({ ...event, deployment: { ...event.deployment, sha: "../../secret" } }, repository));
});

test("build evidence from feature diffs and fail closed on incomplete comparisons", () => {
  assert.ok(releaseFromComparison(job, comparison)!.evidence.includes("manual_csv_export"));
  assert.equal(releaseFromComparison(job, { ...comparison, status: "identical" }), null);
  assert.equal(releaseFromComparison(job, { ...comparison, files: [{ filename: "features/.env", status: "modified", patch: "ignored" }] }), null);
  assert.throws(() => releaseFromComparison(job, { ...comparison, status: "behind" }));
  assert.throws(() => releaseFromComparison(job, { ...comparison, total_commits: 101 }));
  assert.throws(() => releaseFromComparison(job, { ...comparison, files: [{ filename: "features/binary.json", status: "modified" }] }));
});

test("verify current GitHub deployment state before requesting the diff", async () => {
  const urls: string[] = [];
  const responses = [event.deployment, [event.deployment_status], comparison];
  const fetcher: typeof fetch = async input => {
    urls.push(String(input));
    return Response.json(responses.shift());
  };
  const release = await readGitHubRelease(job, undefined, fetcher);
  assert.equal(release?.status, "success");
  assert.equal(urls.length, 3);
  assert.ok(urls[2]?.includes(`/compare/${job.baseSha}...${job.sha}`));
  let calls = 0;
  await assert.rejects(readGitHubRelease(job, undefined, async () => {
    calls++;
    return Response.json(calls === 1 ? event.deployment : [{ state: "failure", environment: "production" }]);
  }), { message: "deployment_no_longer_valid" });
  assert.equal(calls, 2);
});

test("surface GitHub failures without leaking response bodies", async () => {
  await assert.rejects(readGitHubRelease(job, undefined, async () => new Response("private provider details", { status: 403 })), {
    message: "github_http_403",
  });
});
