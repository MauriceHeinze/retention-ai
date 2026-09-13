import { randomUUID } from "node:crypto";
import { customers, release } from "./fixtures.js";
import type { runAgent } from "./agent.js";

type AgentResult = Pick<Awaited<ReturnType<typeof runAgent>>, "assessment" | "steps" | "tools" | "excludedCustomers">;
export type DemoRun = {
  id: string;
  status: "running" | "completed" | "failed";
  simulated: true;
  sources: { release: "fixture"; customers: "fixture"; assessment: "live_model" };
  createdAt: string;
  release: typeof release;
  customers: typeof customers;
  result?: AgentResult;
  error?: string;
};

export function createDemoRunner(assess: () => Promise<AgentResult>, options: {
  now?: () => number;
  maxRunsPerHour?: number;
  log?: (event: object) => void;
} = {}) {
  const now = options.now ?? Date.now;
  const log = options.log ?? (event => console.log(JSON.stringify(event)));
  const runs = new Map<string, DemoRun>();
  let current: DemoRun | undefined;
  let expiresAt = 0;
  let windowStart = now();
  let attempts = 0;
  return {
    start(): { run: DemoRun; reused: boolean } | null {
      if (current && (current.status === "running" || now() < expiresAt)) {
        log({ event: "demo_reused", runId: current.id });
        return { run: current, reused: true };
      }
      if (now() - windowStart >= 3_600_000) { windowStart = now(); attempts = 0; }
      if (attempts >= (options.maxRunsPerHour ?? 6)) {
        log({ event: "demo_limit_reached" });
        return null;
      }
      attempts++;
      const run: DemoRun = {
        id: randomUUID(), status: "running", simulated: true,
        sources: { release: "fixture", customers: "fixture", assessment: "live_model" },
        createdAt: new Date(now()).toISOString(),
        release: structuredClone(release), customers: structuredClone(customers),
      };
      current = run;
      runs.set(run.id, run);
      if (runs.size > 20) runs.delete(runs.keys().next().value!);
      log({ event: "demo_started", runId: run.id });
      void Promise.resolve().then(assess).then(result => {
        run.result = {
          assessment: result.assessment, steps: result.steps,
          tools: result.tools, excludedCustomers: result.excludedCustomers,
        };
        run.status = "completed";
        expiresAt = now() + 10 * 60_000;
        log({ event: "demo_completed", runId: run.id, durationMs: now() - Date.parse(run.createdAt) });
      }).catch(() => {
        run.status = "failed";
        run.error = "The agent could not complete the assessment. Try again in 30 seconds.";
        expiresAt = now() + 30_000;
        log({ event: "demo_failed", runId: run.id, code: "provider_or_validation_error" });
      });
      return { run, reused: false };
    },
    get(id: string) { return runs.get(id); },
  };
}

export type DemoRunner = ReturnType<typeof createDemoRunner>;
