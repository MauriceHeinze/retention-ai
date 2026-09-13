# Testing strategy

The production endpoint remains unchanged. Testing is intentionally split into
deterministic integration coverage and probabilistic AI-quality evaluation.

## One-command verification

```sh
node testing/run-all.mjs
```

This runs:

1. fixture integrity checks for 10 diffs, 20 features, and 100 customers;
2. the backend test suite, including real local HTTP requests against the
   GitHub webhook and demo endpoints, signature validation, queue persistence,
   GitHub comparison handling, Stripe mapping, polling, and safe failures;
3. conversion of all 10 diffs through the real `releaseFromComparison()` path;
4. Promptfoo custom-provider configuration validation.

To additionally execute the model-scored feature detection and customer
matching evaluation through the real production `runAgent()` implementation:

```sh
OPENROUTER_API_KEY=... node testing/run-all.mjs --eval
```

The model evaluation has two separately reported metrics:

- `FeatureDetection`: every newly added feature is found and accurately
  described without inventing implementation details as features;
- `CustomerMatching`: every cancellation reason is evaluated exactly once and
  assigned only to the new feature that addresses it.

## Why this is representative

The synthetic diffs use the same `features/` paths accepted by the production
GitHub comparison filter. The HTTP tests exercise the unchanged endpoint and
queue without external services. Promptfoo uses a custom provider that converts
each unified diff with the real `releaseFromComparison()` function and invokes
the unchanged production `runAgent()` implementation. This exercises the
production system prompt, tool calling, eligibility filtering, structured output
schema, and evidence validation. Together these layers cover the transport and
security contract as well as the two AI behaviors that matter to the product.
