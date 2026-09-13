import assert from "node:assert/strict";
import { test } from "node:test";
import { createSandboxStripe, DEMO_TAG, mapDemoCustomer } from "./stripe.js";

const customer = {
  id: "cus_demo",
  email: "demo@example.com",
  livemode: false,
  metadata: { retentionai_demo: DEMO_TAG, retentionai_case: "customer-manual-csv", retentionai_demo_consent: "true" },
};
const subscription = {
  id: "sub_demo",
  status: "canceled" as const,
  created: 1,
  canceled_at: 2,
  cancellation_details: { comment: "Need CSV", feedback: "missing_features" as const, feedback_option: null, reason: "cancellation_requested" as const },
};

test("block missing, live, and publishable Stripe keys before requests", () => {
  for (const key of [undefined, "", "sk_live_placeholder", "pk_test_placeholder", "rk_live_placeholder"]) {
    assert.throws(() => createSandboxStripe(key));
  }
  assert.doesNotThrow(() => createSandboxStripe("sk_test_placeholder"));
  assert.doesNotThrow(() => createSandboxStripe("rk_test_placeholder"));
});

test("map Stripe subscription feedback and customer contact details", () => {
  assert.deepEqual(mapDemoCustomer(customer, [subscription]), {
    id: "cus_demo", email: "demo@example.com", subscriptionId: "sub_demo", demoCase: "customer-manual-csv",
    feedback: "Need CSV", status: "canceled", marketingConsent: true, contactedReleaseIds: [],
  });
});

test("exclude live and non-demo customers and accounts with ongoing subscriptions", () => {
  assert.equal(mapDemoCustomer({ ...customer, livemode: true }, [subscription]), null);
  assert.equal(mapDemoCustomer({ ...customer, metadata: {} }, [subscription]), null);
  for (const status of ["active", "trialing", "past_due", "unpaid", "paused", "incomplete"] as const) {
    assert.equal(mapDemoCustomer(customer, [subscription, { ...subscription, id: "sub_returned", status }]), null);
  }
});

test("default to no outreach without valid email or explicit demo consent", () => {
  for (const email of [null, "", "invalid"]) {
    assert.equal(mapDemoCustomer({ ...customer, email }, [subscription])?.marketingConsent, false);
  }
  assert.equal(mapDemoCustomer({ ...customer, metadata: { retentionai_demo: DEMO_TAG } }, [subscription])?.marketingConsent, false);
  assert.equal(mapDemoCustomer({ ...customer, metadata: { ...customer.metadata, retentionai_demo_consent: "false" } }, [subscription])?.marketingConsent, false);
});

test("select the latest cancellation and preserve missing feedback and contact history", () => {
  const newer = { ...subscription, id: "sub_new", canceled_at: 3, cancellation_details: { ...subscription.cancellation_details, comment: null } };
  const result = mapDemoCustomer({ ...customer, metadata: { ...customer.metadata, retentionai_contacted_releases: "release-one, release-two" } }, [subscription, newer]);
  assert.equal(result?.subscriptionId, "sub_new");
  assert.equal(result?.feedback, null);
  assert.deepEqual(result?.contactedReleaseIds, ["release-one", "release-two"]);
});

test("exclude involuntary cancellations and customers without cancelled subscriptions", () => {
  assert.equal(mapDemoCustomer(customer, []), null);
  assert.equal(mapDemoCustomer(customer, [{ ...subscription, cancellation_details: null }]), null);
  assert.equal(mapDemoCustomer(customer, [{ ...subscription, cancellation_details: { ...subscription.cancellation_details, reason: "payment_failed" } }]), null);
});
