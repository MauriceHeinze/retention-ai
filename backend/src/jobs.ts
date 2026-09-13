import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { deploymentJobSchema, type DeploymentJob } from "./github.js";

const recordSchema = z.object({
  job: deploymentJobSchema,
  status: z.enum(["queued", "running", "completed", "failed"]),
});
type JobRecord = z.infer<typeof recordSchema>;
export const jobId = (job: DeploymentJob) => createHash("sha256").update(`${job.repository}:${job.sha}`).digest("hex");

export async function createJobQueue(directory: string, processJob: (job: DeploymentJob) => Promise<void>) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const records = new Map<string, JobRecord>();
  const filenames = (await readdir(directory)).filter(name => name.endsWith(".json"));
  if (filenames.length > 1000) throw new Error("Job history is full; archive completed jobs before starting");
  for (const filename of filenames) {
    const record = recordSchema.parse(JSON.parse(await readFile(join(directory, filename), "utf8")));
    if (filename !== `${jobId(record.job)}.json`) throw new Error("Invalid job record filename");
    if (record.status === "running") record.status = "queued";
    records.set(jobId(record.job), record);
  }
  async function save(id: string, record: JobRecord) {
    // persist only repository/deployment identifiers and status, never customer data or drafts
    const temporary = join(directory, `${id}.tmp`);
    await writeFile(temporary, JSON.stringify(record), { mode: 0o600, flush: true });
    await rename(temporary, join(directory, `${id}.json`));
    records.set(id, record);
  }
  let worker: Promise<void> | undefined;
  let accepting = Promise.resolve();
  let stopped = false;
  function startWorker() {
    if (worker || stopped) return;
    worker = (async () => {
      while (!stopped) {
        const next = [...records.entries()].find(([, record]) => record.status === "queued");
        if (!next) break;
        const [id, record] = next;
        await save(id, { ...record, status: "running" });
        try {
          await processJob(record.job);
          await save(id, { ...record, status: "completed" });
          console.log(JSON.stringify({ event: "deployment_completed", jobId: id }));
        } catch {
          await save(id, { ...record, status: "failed" });
          console.error(JSON.stringify({ event: "deployment_failed", jobId: id, action: "redeliver the webhook to retry" }));
        }
      }
    })().catch(() => {
      stopped = true;
      console.error("Job storage failed. Restart after checking disk access.");
    }).finally(() => {
      worker = undefined;
      if (!stopped && [...records.values()].some(record => record.status === "queued")) startWorker();
    });
  }
  startWorker();
  return {
    enqueue(job: DeploymentJob): Promise<{ id: string; duplicate: boolean }> {
      const task = accepting.then(async () => {
        if (stopped) throw new Error("Queue is unavailable");
        const id = jobId(job);
        const existing = records.get(id);
        if (existing && existing.status !== "failed") return { id, duplicate: true };
        if ((!existing && records.size >= 1000) || [...records.values()].filter(record => ["queued", "running"].includes(record.status)).length >= 20) {
          throw new Error("Queue capacity reached");
        }
        await save(id, { job, status: "queued" });
        startWorker();
        return { id, duplicate: false };
      });
      accepting = task.then(() => undefined, () => undefined);
      return task;
    },
    async idle() { await accepting; while (worker) await worker; },
    getStatus(id: string) { return records.get(id)?.status; },
  };
}
