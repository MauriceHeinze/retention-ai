import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { GitHubError, getDeploymentJob, type DeploymentJob } from "./github.js";
import { z, ZodError } from "zod";
import type { DemoRunner } from "./demo.js";
import { EmailError, type DemoEmailer } from "./email.js";

export function verifySignature(body: Buffer, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(body).digest("hex")}`);
  const supplied = Buffer.from(signature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function createWebhookServer(options: {
  secret?: string;
  repository?: string;
  enqueue?: (job: DeploymentJob) => Promise<{ id: string; duplicate: boolean }>;
  demo?: DemoRunner;
  sendDemoEmail?: DemoEmailer;
  deploymentStatus?: (id: string) => string | undefined;
  allowedOrigins?: string[];
  requestsPerMinute?: number;
}) {
  if (options.secret !== undefined && options.secret.length < 32) throw new Error("Use a webhook secret with at least 32 characters");
  const maxBytes = 256 * 1024;
  let windowStart = Date.now();
  let requests = 0;
  function respond(response: ServerResponse, status: number, body: object) {
    response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    response.end(JSON.stringify(body));
  }
  async function readDemoJson(request: IncomingMessage): Promise<unknown> {
    if (request.headers["content-type"]?.split(";")[0]?.trim() !== "application/json") {
      request.resume(); throw new EmailError(415, "Use application/json");
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request) {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size > 1024) throw new EmailError(413, "Demo request is too large");
      chunks.push(bytes);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { throw new EmailError(400, "Use a valid JSON object"); }
  }
  async function handle(request: IncomingMessage, response: ServerResponse) {
    if (Date.now() - windowStart >= 60_000) { windowStart = Date.now(); requests = 0; }
    if (++requests > (options.requestsPerMinute ?? 120)) {
      response.setHeader("Retry-After", "60");
      respond(response, 429, { error: "Too many requests. Try again shortly." });
      request.resume();
      return;
    }
    if (request.method === "GET" && request.url === "/healthz") { respond(response, 200, { status: "ok" }); return; }
    if (request.url?.startsWith("/api/demo/")) {
      const origin = request.headers.origin;
      response.setHeader("Vary", "Origin");
      if (origin && !options.allowedOrigins?.includes(origin)) {
        respond(response, 403, { error: "This dashboard origin is not allowed" }); request.resume(); return;
      }
      if (origin) response.setHeader("Access-Control-Allow-Origin", origin);
      if (request.method === "OPTIONS") {
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.writeHead(204); response.end(); return;
      }
      if (!options.demo) { respond(response, 503, { error: "The demo is not configured yet" }); request.resume(); return; }
      if (request.url === "/api/demo/deployments" && request.method === "GET") {
        respond(response, 200, { runs: options.demo.deployments() }); return;
      }
      if (request.url === "/api/demo/runs") {
        if (request.method !== "POST") { response.setHeader("Allow", "POST"); respond(response, 405, { error: "Use POST" }); request.resume(); return; }
        const body = await readDemoJson(request);
        try { z.object({}).strict().parse(body); }
        catch { respond(response, 400, { error: "Use an empty JSON object. The demo uses fixed sample data." }); return; }
        const started = options.demo.start();
        if (!started) { response.setHeader("Retry-After", "3600"); respond(response, 429, { error: "Demo capacity reached. Try again later." }); return; }
        respond(response, started.run.status === "running" ? 202 : 200, { ...started.run, reused: started.reused }); return;
      }
      const segments = request.url.split("/");
      if (segments.length === 6 && segments[3] === "runs" && segments[5] === "send") {
        if (request.method !== "POST") { response.setHeader("Allow", "POST"); respond(response, 405, { error: "Use POST" }); request.resume(); return; }
        if (!options.sendDemoEmail) { respond(response, 503, { error: "Demo email is not configured yet" }); request.resume(); return; }
        const body = await readDemoJson(request);
        const approval = z.object({ customerId: z.string().min(1).max(100), approved: z.literal(true) }).strict().safeParse(body);
        if (!approval.success) { respond(response, 400, { error: "Provide customerId and approved: true. Recipient and draft content cannot be changed." }); return; }
        const delivery = await options.sendDemoEmail(segments[4]!, approval.data.customerId);
        respond(response, 200, delivery); return;
      }
      const id = request.url.slice("/api/demo/runs/".length);
      if (request.url.startsWith("/api/demo/runs/") && request.method === "GET") {
        const run = options.demo.get(id);
        const deploymentStatus = options.deploymentStatus?.(id);
        if (!run && deploymentStatus) {
          respond(response, 200, {
            id, status: ["queued", "running"].includes(deploymentStatus) ? "running" : "failed",
            ...(deploymentStatus === "failed" ? { error: "Deployment analysis failed. Redeliver the GitHub webhook to retry." }
              : deploymentStatus === "completed" ? { error: "This deployment produced no reviewable feature change." } : {}),
          }); return;
        }
        respond(response, run ? 200 : 404, run ?? { error: "Demo run not found. Start a new demo." }); return;
      }
      respond(response, 404, { error: "Demo route not found" }); request.resume(); return;
    }
    if (request.url !== "/webhooks/github") { respond(response, 404, { error: "Route not found" }); request.resume(); return; }
    if (!options.secret || !options.repository || !options.enqueue) { respond(response, 503, { error: "GitHub integration is not configured yet" }); request.resume(); return; }
    if (request.method !== "POST") { response.setHeader("Allow", "POST"); respond(response, 405, { error: "Use POST" }); request.resume(); return; }
    if (!request.headers["content-type"]?.startsWith("application/json")) {
      respond(response, 415, { error: "Use application/json" }); request.resume(); return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request) {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size > maxBytes) { respond(response, 413, { error: "Webhook payload is too large" }); return; }
      chunks.push(bytes);
    }
    const body = Buffer.concat(chunks);
    const signature = request.headers["x-hub-signature-256"];
    if (!verifySignature(body, typeof signature === "string" ? signature : undefined, options.secret)) {
      respond(response, 401, { error: "Webhook signature could not be verified" }); return;
    }
    const event = request.headers["x-github-event"];
    if (event === "ping") { respond(response, 200, { status: "pong" }); return; }
    if (event !== "deployment_status") { respond(response, 202, { status: "ignored", reason: "event_type" }); return; }
    const payload: unknown = JSON.parse(body.toString("utf8"));
    const job = getDeploymentJob(payload, options.repository);
    if (!job) { respond(response, 202, { status: "ignored", reason: "not_successful_production" }); return; }
    const accepted = await options.enqueue(job);
    respond(response, 202, { status: accepted.duplicate ? "duplicate" : "queued", jobId: accepted.id, runId: accepted.id, simulated: true });
  }
  return createServer({ requestTimeout: 10_000, headersTimeout: 10_000, maxHeaderSize: 16_384 }, (request, response) => {
    void handle(request, response).catch(error => {
      if (response.headersSent || response.destroyed) return;
      if (error instanceof EmailError) {
        if (error.status === 429) response.setHeader("Retry-After", "3600");
        respond(response, error.status, { error: error.message }); return;
      }
      const invalid = error instanceof SyntaxError || error instanceof ZodError;
      const forbidden = error instanceof GitHubError && error.code === "repository_not_allowed";
      respond(response, invalid ? 400 : forbidden ? 403 : 503, {
        error: invalid ? "Webhook data does not match the demo format" : forbidden ? "Repository is not allowed" : "Unable to queue the event. Redeliver it shortly.",
      });
    });
  });
}
