import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const testingDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testingDirectory, "..");
const runModelEval = process.argv.includes("--eval");

function run(label, command, args, cwd = repositoryRoot) {
  console.log(`\n[${label}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd, stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("fixtures", process.execPath, ["testing/promptfoo/validate-fixtures.mjs"]);
run("backend", "npm", ["test"], resolve(repositoryRoot, "backend"));

const fixtureSource = readFileSync(resolve(repositoryRoot, "testing/promptfoo/feature-detection-tests.yaml"), "utf8");
const fixtureCases = fixtureSource.split(/(?=^- description:)/m).filter(Boolean);
for (const [index, testCase] of fixtureCases.entries()) {
  const diff = testCase.match(/^    diff: \|\n([\s\S]*)$/m)?.[1].replace(/^      /gm, "");
  const customers = JSON.parse(testCase.match(/^    customers: >-\n      (.+)$/m)?.[1]);
  const result = spawnSync(process.execPath, ["--import", "tsx", resolve(repositoryRoot, "testing/promptfoo/run-production-agent.ts")], {
    cwd: resolve(repositoryRoot, "backend"),
    input: JSON.stringify({ diff, customers, validateOnly: true }),
    encoding: "utf8",
    env: process.env,
  });
  if (result.status !== 0) {
    process.stderr.write(`Production adapter failed for test ${index + 1}: ${result.stderr || "unknown error\n"}`);
    process.exit(result.status ?? 1);
  }
}
console.log(`\n[production-adapter] Validated ${fixtureCases.length} cases through releaseFromComparison().`);

run("promptfoo-config", "npx", ["--yes", "promptfoo@latest", "validate", "-c", "testing/promptfoo/promptfooconfig.yaml"]);

if (runModelEval) {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("\nOPENROUTER_API_KEY is required for --eval.");
    process.exit(1);
  }
  run("promptfoo-eval", "npx", ["--yes", "promptfoo@latest", "eval", "-c", "testing/promptfoo/promptfooconfig.yaml"]);
} else {
  console.log("\nStatic, HTTP, queue, GitHub, Stripe, and Promptfoo configuration checks passed.");
  console.log("Run `node testing/run-all.mjs --eval` to execute the paid model evaluation.");
}
