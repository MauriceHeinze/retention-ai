import Stripe from "stripe";
import { z } from "zod";
import type { Customer } from "./types.js";

export const DEMO_TAG = "retentionai-v1";

export class SetupError extends Error {}

export function createSandboxStripe(apiKey: string | undefined): Stripe {
  const key = apiKey?.trim();
  if (!key || (!key.startsWith("sk_test_") && !key.startsWith("rk_test_"))) {
    throw new SetupError("Set STRIPE_SECRET_KEY to a Stripe sandbox server-side key. Live and publishable keys are blocked.");
  }
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 20_000 });
}

type SubscriptionSnapshot = Pick<Stripe.Subscription,
  "id" | "status" | "canceled_at" | "created" | "cancellation_details">;
type CustomerSnapshot = Pick<Stripe.Customer, "id" | "email" | "metadata" | "livemode">;

export type StripeDemoCustomer = Customer & {
  email: string | null;
  subscriptionId: string;
  demoCase: string;
};

export function mapDemoCustomer(
  customer: CustomerSnapshot,
  subscriptions: SubscriptionSnapshot[],
): StripeDemoCustomer | null {
  if (customer.livemode || customer.metadata.retentionai_demo !== DEMO_TAG) return null;
  // any ongoing subscription blocks outreach, including trials and past-due accounts
  if (subscriptions.some(subscription => !["canceled", "incomplete_expired"].includes(subscription.status))) return null;
  const cancellation = subscriptions
    .filter(subscription => subscription.status === "canceled")
    .sort((a, b) => (b.canceled_at ?? b.created) - (a.canceled_at ?? a.created) || b.id.localeCompare(a.id))[0];
  if (!cancellation || cancellation.cancellation_details?.reason !== "cancellation_requested") return null;
  const email = customer.email?.trim() || null;
  return {
    id: customer.id,
    email,
    subscriptionId: cancellation.id,
    demoCase: customer.metadata.retentionai_case ?? "",
    feedback: cancellation.cancellation_details.comment?.trim() || null,
    status: "canceled",
    // synthetic consent is for the demo only; real consent must come from the email provider
    marketingConsent: customer.metadata.retentionai_demo_consent === "true" && z.email().safeParse(email).success,
    contactedReleaseIds: (customer.metadata.retentionai_contacted_releases ?? "").split(",").map(id => id.trim()).filter(Boolean),
  };
}

export async function readDemoCustomers(stripe: Stripe): Promise<StripeDemoCustomer[]> {
  const records: StripeDemoCustomer[] = [];
  for await (const customer of stripe.customers.list({ limit: 100 })) {
    if (customer.livemode || customer.metadata.retentionai_demo !== DEMO_TAG) continue;
    const subscriptions: Stripe.Subscription[] = [];
    for await (const subscription of stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 100 })) {
      if (subscription.livemode) throw new SetupError("Live Stripe data is blocked in the sandbox demo.");
      subscriptions.push(subscription);
    }
    const record = mapDemoCustomer(customer, subscriptions);
    if (record) records.push(record);
  }
  return records;
}

export function reportStripeError(error: unknown): void {
  if (error instanceof SetupError) {
    console.error(error.message);
  } else if (error instanceof Stripe.errors.StripeError) {
    // do not print raw provider messages, headers, or customer data
    console.error("Stripe request failed.", {
      status: error.statusCode ?? null,
      requestId: error.requestId ?? null,
    });
    console.error("Check the sandbox key, its permissions, and the request in Stripe Workbench logs.");
  } else {
    console.error("The Stripe demo failed. Check connectivity and run npm test for local validation.");
  }
}
