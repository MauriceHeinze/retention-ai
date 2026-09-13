import { createHash } from "node:crypto";
import { z } from "zod";
import type { DemoRunner } from "./demo.js";
import { canContact } from "./policy.js";

export class EmailError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export type EmailDelivery = {
  status: "sending" | "accepted" | "failed";
  provider: "resend";
  testOnly: true;
  messageId?: string;
  error?: string;
};
type Draft = { subject: string; body: string };
type Sender = (draft: Draft, idempotencyKey: string) => Promise<string>;

export function createResendSender(apiKey: string, recipient: string, fetcher: typeof fetch = fetch): Sender {
  if (!apiKey.trim() || !z.email().safeParse(recipient).success) throw new Error("Check Resend demo settings");
  return async (draft, idempotencyKey) => {
    try {
      const response = await fetcher("https://api.resend.com/emails", {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(8_000),
        headers: {
          Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json",
          "User-Agent": "Node.js", "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          from: "RetentionAI Demo <onboarding@resend.dev>", to: [recipient],
          subject: `[RetentionAI demo] ${draft.subject}`,
          text: `${draft.body}\n\nThis is a RetentionAI demo using sample customer data. It was sent only to the configured test inbox.`,
        }),
      });
      if (!response.ok) throw new Error("Provider rejected request");
      return z.object({ id: z.string().min(1).max(100) }).parse(await response.json()).id;
    } catch {
      throw new EmailError(503, "Resend did not confirm this email. Check the sender settings or retry the same draft.");
    }
  };
}

export function createDemoEmailer(demo: DemoRunner, sender: Sender, options: {
  now?: () => number;
  maxAttemptsPerHour?: number;
  log?: (event: object) => void;
} = {}) {
  const now = options.now ?? Date.now;
  const log = options.log ?? (event => console.log(JSON.stringify(event)));
  const pending = new Map<string, Promise<EmailDelivery>>();
  let windowStart = now();
  let attempts = 0;
  return async (runId: string, customerId: string) => {
    const run = demo.get(runId);
    if (!run) throw new EmailError(404, "Demo run not found. Start a new demo.");
    if (run.status !== "completed" || now() - Date.parse(run.createdAt) >= 23 * 3_600_000) {
      throw new EmailError(409, "This demo is not ready to send. Start or finish a recent demo first.");
    }
    const customer = run.customers.find(item => item.id === customerId);
    const decision = run.result?.assessment.decisions.find(item => item.customerId === customerId);
    if (!customer || !canContact(customer, run.release.id) || decision?.decision !== "match" || !decision.draft) {
      throw new EmailError(409, "Only an eligible matched customer with a draft can be approved.");
    }
    const existing = run.deliveries?.[customerId];
    if (existing?.status === "accepted") return { ...existing, reused: true };
    const key = createHash("sha256").update(JSON.stringify([run.id, customerId, decision.draft])).digest("hex");
    const inProgress = pending.get(key);
    if (inProgress) return { ...await inProgress, reused: true };
    if (now() - windowStart >= 3_600_000) { windowStart = now(); attempts = 0; }
    if (attempts >= (options.maxAttemptsPerHour ?? 6)) {
      log({ event: "email_limit_reached" });
      throw new EmailError(429, "Demo email capacity reached. Try again later.");
    }
    attempts++;
    const deliveries = run.deliveries ??= {};
    deliveries[customerId] = { status: "sending", provider: "resend", testOnly: true };
    log({ event: "email_approved", runId, customerId });
    const sending = Promise.resolve().then(() => sender(decision.draft!, key)).then(messageId => {
      const delivery: EmailDelivery = { status: "accepted", provider: "resend", testOnly: true, messageId };
      deliveries[customerId] = delivery;
      log({ event: "email_accepted", runId, customerId, messageId });
      return delivery;
    }).catch(() => {
      deliveries[customerId] = { status: "failed", provider: "resend", testOnly: true, error: "Resend did not confirm this email. Retry the same draft." };
      log({ event: "email_failed", runId, customerId, code: "provider_error" });
      throw new EmailError(503, deliveries[customerId].error!);
    }).finally(() => pending.delete(key));
    pending.set(key, sending);
    return { ...await sending, reused: false };
  };
}

export type DemoEmailer = ReturnType<typeof createDemoEmailer>;
