import Stripe from "stripe";
import { customers } from "./fixtures.js";
import { createSandboxStripe, DEMO_TAG, reportStripeError, SetupError } from "./stripe.js";

async function seed() {
  const stripe = createSandboxStripe(process.env.STRIPE_SECRET_KEY);
  const demoCustomers = new Map<string, Stripe.Customer>();
  for await (const customer of stripe.customers.list({ limit: 100 })) {
    if (customer.metadata.retentionai_demo !== DEMO_TAG) continue;
    if (customer.livemode) throw new SetupError("Live Stripe records are blocked.");
    const scenario = customer.metadata.retentionai_case;
    if (!scenario) continue;
    if (demoCustomers.has(scenario)) throw new SetupError("Duplicate demo customers found. Review the sandbox before seeding again.");
    demoCustomers.set(scenario, customer);
  }

  let price = (await stripe.prices.list({ lookup_keys: [DEMO_TAG], limit: 1 })).data[0];
  if (!price) {
    let product: Stripe.Product | undefined;
    for await (const item of stripe.products.list({ limit: 100 })) {
      if (item.metadata.retentionai_demo === DEMO_TAG) {
        product = item;
        break;
      }
    }
    product ??= await stripe.products.create({
      name: "RetentionAI demo subscription",
      metadata: { retentionai_demo: DEMO_TAG },
    }, { idempotencyKey: `${DEMO_TAG}-product` });
    price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: 1900,
      recurring: { interval: "month" },
      lookup_key: DEMO_TAG,
      metadata: { retentionai_demo: DEMO_TAG },
    }, { idempotencyKey: `${DEMO_TAG}-price` });
  }
  if (price.livemode) throw new SetupError("Live Stripe prices are blocked.");

  let createdCustomers = 0;
  let createdSubscriptions = 0;
  let canceledSubscriptions = 0;
  for (const scenario of customers) {
    let customer = demoCustomers.get(scenario.id);
    if (!customer) {
      customer = await stripe.customers.create({
        name: `RetentionAI demo: ${scenario.id}`,
        email: `${scenario.id}@example.com`,
        metadata: {
          retentionai_demo: DEMO_TAG,
          retentionai_case: scenario.id,
          retentionai_demo_consent: String(scenario.marketingConsent),
        },
      }, { idempotencyKey: `${DEMO_TAG}-${scenario.id}-customer` });
      createdCustomers++;
    }
    const existing: Stripe.Subscription[] = [];
    for await (const subscription of stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 100 })) {
      if (subscription.metadata.retentionai_demo === DEMO_TAG) existing.push(subscription);
    }
    if (existing.length > 1) throw new SetupError("Multiple demo subscriptions found for one customer. Review the sandbox before continuing.");
    let subscription = existing[0];
    if (!subscription) {
      // a trial avoids payment methods and money movement in the synthetic setup
      subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        trial_period_days: 7,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
        metadata: { retentionai_demo: DEMO_TAG, retentionai_case: scenario.id },
      }, { idempotencyKey: `${DEMO_TAG}-${scenario.id}-subscription` });
      createdSubscriptions++;
    }
    if (subscription.livemode) throw new SetupError("Live Stripe subscriptions are blocked.");
    if (subscription.status !== "canceled") {
      await stripe.subscriptions.cancel(subscription.id, {
        invoice_now: false,
        prorate: false,
        ...(scenario.feedback ? { cancellation_details: {
          comment: scenario.feedback,
          feedback: scenario.id === "customer-price" ? "too_expensive" : "missing_features",
        } } : {}),
      });
      canceledSubscriptions++;
    }
  }
  console.log("Stripe sandbox fixtures are ready.", { createdCustomers, createdSubscriptions, canceledSubscriptions });
}

try {
  await seed();
} catch (error) {
  reportStripeError(error);
  process.exitCode = 1;
}
