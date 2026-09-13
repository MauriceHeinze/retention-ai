import { resolve } from "node:path";
import { z } from "zod";
import { runAgent } from "./agent.js";
import { readGitHubRelease, GitHubError } from "./github.js";
import { createJobQueue } from "./jobs.js";
import { createSandboxStripe, readDemoCustomers } from "./stripe.js";
import { createWebhookServer } from "./webhook.js";
import { canContact } from "./policy.js";
import { createDemoRunner } from "./demo.js";
import { customers as sampleCustomers, release as sampleRelease } from "./fixtures.js";
import { createDemoEmailer, createResendSender } from "./email.js";

const configSchema = z.object({
  OPENROUTER_API_KEY: z.string().trim().optional(),
  OPENROUTER_MODEL: z.string().trim().min(1).default("google/gemini-3.8-flash"),
  RESEND_API_KEY: z.string().trim().optional(),
  DEMO_RECIPIENT_EMAIL: z.string().trim().optional(),
  STRIPE_SECRET_KEY: z.string().trim().optional(),
  GITHUB_REPOSITORY: z.literal("ilindaniel/retention-ai-testing").default("ilindaniel/retention-ai-testing"),
  GITHUB_TOKEN: z.string().trim().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173,http://127.0.0.1:5173"),
  JOBS_DIRECTORY: z.string().default(".retentionai/jobs"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3002),
});
const config = configSchema.safeParse(process.env);
if (!config.success) {
  console.error("Check backend environment settings:", [...new Set(config.error.issues.map(issue => issue.path.join(".")))]);
  process.exitCode = 1;
} else {
  try {
    const settings = config.data;
    const apiKey = settings.OPENROUTER_API_KEY;
    const allowedOrigins = settings.ALLOWED_ORIGINS.split(",").map(value => value.trim()).filter(Boolean);
    for (const origin of allowedOrigins) {
      const url = new URL(origin);
      if (!["http:", "https:"].includes(url.protocol) || url.origin !== origin) throw new Error("Invalid dashboard origin");
    }
    const demo = apiKey ? createDemoRunner(() => runAgent(apiKey, settings.OPENROUTER_MODEL, sampleRelease, sampleCustomers)) : undefined;
    const sendDemoEmail = demo && settings.RESEND_API_KEY && settings.DEMO_RECIPIENT_EMAIL
      ? createDemoEmailer(demo, createResendSender(settings.RESEND_API_KEY, settings.DEMO_RECIPIENT_EMAIL))
      : undefined;
    let integration = {};
    if (settings.GITHUB_WEBHOOK_SECRET) {
      if (!apiKey || !settings.STRIPE_SECRET_KEY) throw new Error("GitHub integration requires provider keys");
      const stripe = createSandboxStripe(settings.STRIPE_SECRET_KEY);
      const queue = await createJobQueue(resolve(settings.JOBS_DIRECTORY), async job => {
      try {
        const release = await readGitHubRelease(job, settings.GITHUB_TOKEN);
        if (!release) { console.log(JSON.stringify({ event: "deployment_skipped", reason: "no_feature_changes" })); return; }
        const customers = await readDemoCustomers(stripe);
        if (!customers.some(customer => canContact(customer, release.id))) {
          console.log(JSON.stringify({ event: "deployment_skipped", reason: "no_eligible_demo_customers" }));
          return;
        }
        const result = await runAgent(apiKey, settings.OPENROUTER_MODEL, release, customers);
        // sandbox-only output for local review; no email addresses or credentials are logged
        console.log(JSON.stringify({ event: "assessment_ready", simulated: true, releaseId: release.id, ...result }));
      } catch (error) {
        console.error(JSON.stringify({ event: "assessment_failed", code: error instanceof GitHubError ? error.code : "provider_or_validation_error" }));
        throw error;
      }
      });
      integration = { secret: settings.GITHUB_WEBHOOK_SECRET, repository: settings.GITHUB_REPOSITORY, enqueue: queue.enqueue };
    }
    const server = createWebhookServer({ ...integration, ...(demo ? { demo } : {}), ...(sendDemoEmail ? { sendDemoEmail } : {}), allowedOrigins });
    server.on("error", () => { console.error("Unable to start the webhook server. Check the host and port."); process.exitCode = 1; });
    server.listen(settings.PORT, settings.HOST, () => {
      console.log(JSON.stringify({ event: "server_ready", port: settings.PORT, demoConfigured: Boolean(demo), emailConfigured: Boolean(sendDemoEmail), githubConfigured: Boolean(settings.GITHUB_WEBHOOK_SECRET) }));
    });
  } catch {
    console.error("Server setup failed. Check provider settings, allowed origins, and job-storage permissions.");
    process.exitCode = 1;
  }
}
