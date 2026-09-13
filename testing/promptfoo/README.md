# Git-diff feature detection eval

This dataset evaluates whether the real production RetentionAI agent can
recognize newly introduced product features from unified git diffs and map every
supplied cancellation reason to the feature that addresses it.

The suite contains 10 synthetic diffs and 20 expected features:

- three diffs with one feature;
- four diffs with two features;
- three diffs with three features.

`expected_features` and `expected_matches` are available to Promptfoo assertions
but are not interpolated into the tested prompt. Only `diff` and `customers` are
sent to the agent. Each expected feature has a stable ID for reporting, a name,
and a behavioral description. A feature is one cohesive user capability;
implementation details such as routes, storage, tests, or dependencies do not
count separately.

Run from the repository root:

```sh
cd backend
npm install
node ../testing/promptfoo/validate-fixtures.mjs
npx promptfoo@latest eval -c ../testing/promptfoo/promptfooconfig.yaml
```

The custom Promptfoo provider invokes the unchanged backend `runAgent()` function,
including its production prompts, tools, output schema, and evidence validation.
Deterministic assertions check the production response contract, complete
customer coverage, and tool use. Separate model-graded metrics infer feature
recognition from matching decisions and evaluate every customer assignment
against hidden semantic ground truth.

## Customer matching data

`testing/fixtures/retentionai-stripe-customers.csv` contains 100 additional
synthetic canceled customers, ten for each diff in this suite. The original
customer rows and the eight-column import schema are unchanged.

For generated rows, `demo_case` stores hidden evaluation ground truth as
`feature-XX__<feature-id>`. The numeric part identifies the diff and the suffix
matches an `expected_features[].id` from this dataset. The matching agent should
receive `customer_id` and `cancellation_reason`, but not `demo_case`.
