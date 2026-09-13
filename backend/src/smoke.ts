import assert from "node:assert/strict";
import Stripe from "stripe";
import { runAgent } from "./agent.js";
import { customers, release } from "./fixtures.js";
import { createSandboxStripe, readDemoCustomers, reportStripeError, SetupError } from "./stripe.js";
import { getDeploymentJob, releaseFromComparison } from "./github.js";
import { githubComparisonFixture, githubDeploymentFixture } from "./github-fixtures.js";

const apiKey = process.env.OPENROUTER_API_KEY?.trim();
const modelId = process.env.OPENROUTER_MODEL?.trim() || "google/gemini-3.8-flash";
const usesGitHubFixture = process.argv.includes("--github-fixture");
const usesStripe = process.argv.includes("--stripe") || usesGitHubFixture;

if (!apiKey) {
  console.error("Set OPENROUTER_API_KEY in your local environment, then run npm run agent:smoke again.");
  process.exitCode = 1;
} else {
  try {
    console.log(`Running RetentionAI with synthetic data using ${modelId}`);
    const stripeCustomers = usesStripe ? await readDemoCustomers(createSandboxStripe(process.env.STRIPE_SECRET_KEY)) : null;
    if (stripeCustomers) {
      const actualScenarios = stripeCustomers.map(customer => customer.demoCase).sort();
      const expectedScenarios = customers.map(customer => customer.id).sort();
      if (JSON.stringify(actualScenarios) !== JSON.stringify(expectedScenarios)) {
        throw new SetupError("Expected five demo cancellation scenarios. Run npm run stripe:seed, or check whether the sandbox fixtures were changed.");
      }
      console.log(`Read ${stripeCustomers.length} demo cancellation records from Stripe. Release data is still synthetic.`);
    }
    const selectedRelease = usesGitHubFixture
      ? releaseFromComparison(getDeploymentJob(githubDeploymentFixture, githubDeploymentFixture.repository.full_name)!, githubComparisonFixture)
      : release;
    if (!selectedRelease) throw new SetupError("The demo comparison must include a feature change.");
    if (usesGitHubFixture) console.log("GitHub input is a local simulated deployment and code diff. No GitHub event has been delivered yet.");
    const result = await runAgent(apiKey, modelId, selectedRelease, stripeCustomers ?? customers);
    console.log(JSON.stringify(result, null, 2));
    const scenarioById = new Map(stripeCustomers?.map(customer => [customer.id, customer.demoCase]));
    const decisions = Object.fromEntries(result.assessment.decisions.map(item => [scenarioById.get(item.customerId) ?? item.customerId, item.decision]));
    assert.deepEqual(decisions, {
      "customer-manual-csv": "match",
      "customer-scheduled-csv": "no_match",
      "customer-price": "no_match",
      "customer-unknown": "needs_review",
    });
    console.log("PASS: expected matches, source evidence, tool use, and opt-out filtering. No email was sent.");
  } catch (error) {
    if (usesStripe && (error instanceof SetupError || error instanceof Stripe.errors.StripeError)) {
      reportStripeError(error);
      process.exitCode = 1;
    } else {
      // avoid printing provider errors that could include credentials or request data
      const knownNames = ["AI_NoObjectGeneratedError", "AI_NoOutputGeneratedError", "AI_APICallError", "AI_RetryError", "AI_TypeValidationError", "TimeoutError", "AssertionError", "TypeError", "Error"];
      console.error("Failure category:", error instanceof Error && knownNames.includes(error.name) ? error.name : "unclassified");
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error
        && typeof error.statusCode === "number" ? error.statusCode : null;
      console.error(statusCode
        ? `Agent test failed (HTTP ${statusCode}). Check API access, model availability, and account credit.`
        : "Agent test failed. Check connectivity and model output; local checks are available with npm test.");
      process.exitCode = 1;
    }
  }
}
