import { z } from "zod";
import type { Release } from "./types.js";

const shaSchema = z.string().length(40).refine(value => [...value].every(char => "0123456789abcdef".includes(char)));
export const deploymentSchema = z.object({
  id: z.number().int().positive(),
  sha: shaSchema,
  environment: z.string(),
  production_environment: z.boolean(),
  payload: z.object({ retentionai_demo: z.literal(true), base_sha: shaSchema }),
});
export const deploymentEventSchema = z.object({
  repository: z.object({ full_name: z.string().max(200) }),
  deployment: deploymentSchema,
  deployment_status: z.object({ state: z.string(), environment: z.string() }),
});
export const deploymentJobSchema = z.object({
  repository: z.string().max(200),
  deploymentId: z.number().int().positive(),
  sha: shaSchema,
  baseSha: shaSchema,
});
export type DeploymentJob = z.infer<typeof deploymentJobSchema>;

export class GitHubError extends Error {
  constructor(public readonly code: string) { super(code); }
}

export function getDeploymentJob(payload: unknown, repository: string): DeploymentJob | null {
  const event = deploymentEventSchema.parse(payload);
  if (event.repository.full_name.toLowerCase() !== repository.toLowerCase()) throw new GitHubError("repository_not_allowed");
  if (event.deployment_status.state !== "success" || event.deployment_status.environment !== "production"
    || event.deployment.environment !== "production" || !event.deployment.production_environment) return null;
  return {
    repository: repository.toLowerCase(), deploymentId: event.deployment.id,
    sha: event.deployment.sha, baseSha: event.deployment.payload.base_sha,
  };
}

const comparisonSchema = z.object({
  status: z.enum(["ahead", "behind", "diverged", "identical"]),
  total_commits: z.number().int().nonnegative(),
  commits: z.array(z.object({ commit: z.object({ message: z.string() }) })),
  files: z.array(z.object({ filename: z.string(), status: z.string(), patch: z.string().optional() })).default([]),
});

export function releaseFromComparison(job: DeploymentJob, input: unknown): Release | null {
  const comparison = comparisonSchema.parse(input);
  if (comparison.status === "identical") return null;
  if (comparison.status !== "ahead") throw new GitHubError("non_forward_deployment_needs_review");
  if (comparison.total_commits > 100 || comparison.commits.length !== comparison.total_commits || comparison.files.length >= 300) {
    throw new GitHubError("change_set_too_large_needs_review");
  }
  // only the test repository's feature fixtures are release evidence for this demo
  const files = comparison.files.filter(file => file.filename.startsWith("features/")
    && !file.filename.split("/").some(part => part.startsWith(".") || part === "node_modules")
    && [".json", ".ts", ".js", ".txt"].some(extension => file.filename.endsWith(extension)));
  if (files.length === 0) return null;
  if (files.some(file => !file.patch)) throw new GitHubError("missing_diff_needs_review");
  const evidence = [
    `Repository: ${job.repository}`,
    `Deployed commit: ${job.sha}`,
    "SIMULATED deployment: this test does not verify an actual hosted feature.",
    "Commit messages:", ...comparison.commits.map(commit => commit.commit.message),
    "Changed feature files:", ...files.map(file => `${file.filename} (${file.status})\n${file.patch}`),
  ].join("\n\n");
  if (evidence.length > 30_000) throw new GitHubError("change_set_too_large_needs_review");
  return { id: `github:${job.repository}:${job.sha}`, environment: "production", status: "success", evidence };
}

export async function readGitHubRelease(job: DeploymentJob, token?: string, fetcher: typeof fetch = fetch): Promise<Release | null> {
  const path = job.repository.split("/").map(encodeURIComponent).join("/");
  async function get(suffix: string): Promise<unknown> {
    const response = await fetcher(`https://api.github.com/repos/${path}/${suffix}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10",
        "User-Agent": "Node.js",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new GitHubError(`github_http_${response.status}`);
    const text = await response.text();
    if (text.length > 2_000_000) throw new GitHubError("github_response_too_large");
    return JSON.parse(text) as unknown;
  }
  const deployment = deploymentSchema.parse(await get(`deployments/${job.deploymentId}`));
  const statuses = z.array(z.object({ state: z.string(), environment: z.string() }))
    .parse(await get(`deployments/${job.deploymentId}/statuses?per_page=1`));
  if (deployment.sha !== job.sha || deployment.payload.base_sha !== job.baseSha
    || deployment.environment !== "production" || !deployment.production_environment
    || statuses[0]?.state !== "success" || statuses[0]?.environment !== "production") {
    throw new GitHubError("deployment_no_longer_valid");
  }
  return releaseFromComparison(job, await get(`compare/${job.baseSha}...${job.sha}?per_page=100`));
}
