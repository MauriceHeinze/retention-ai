import assert from "node:assert/strict";
import { runAgent } from "./agent.js";

const apiKey = process.env.OPENROUTER_API_KEY?.trim();
const modelId = process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.5-flash-lite";

if (!apiKey) {
  console.error("Set OPENROUTER_API_KEY in your local environment, then run npm run agent:smoke again.");
  process.exitCode = 1;
} else {
  try {
    console.log(`Running RetentionAI with synthetic data using ${modelId}`);
    const result = await runAgent(apiKey, modelId);
    console.log(JSON.stringify(result, null, 2));
    const decisions = Object.fromEntries(result.assessment.decisions.map(item => [item.customerId, item.decision]));
    assert.deepEqual(decisions, {
      "customer-manual-csv": "match",
      "customer-scheduled-csv": "no_match",
      "customer-price": "no_match",
      "customer-unknown": "needs_review",
    });
    console.log("PASS: expected matches, source evidence, tool use, and opt-out filtering. No email was sent.");
  } catch (error) {
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
