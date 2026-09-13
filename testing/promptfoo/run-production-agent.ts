import { runAgent } from "../../backend/src/agent.js";
import { releaseFromComparison, type DeploymentJob } from "../../backend/src/github.js";
import type { Customer } from "../../backend/src/types.js";

type EvalInput = {
  diff: string;
  customers: Array<{ customer_id: string; cancellation_reason: string }>;
  modelId?: string;
  validateOnly?: boolean;
};

function filesFromUnifiedDiff(diff: string) {
  return diff.split(/(?=^diff --git )/m).filter(Boolean).map(section => {
    const header = section.match(/^diff --git a\/(.+?) b\/(.+)$/m);
    if (!header || header[1] !== header[2]) throw new Error("Eval diff has an invalid file header");
    return {
      filename: header[2],
      status: section.includes("\nnew file mode ") ? "added" : "modified",
      patch: section,
    };
  });
}

async function readInput(): Promise<EvalInput> {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 100_000) throw new Error("Eval input is too large");
  }
  return JSON.parse(input) as EvalInput;
}

async function main() {
  const input = await readInput();
  if (typeof input.diff !== "string" || !Array.isArray(input.customers)) throw new Error("Invalid eval input");
  const job: DeploymentJob = {
    repository: "ilindaniel/retention-ai-testing",
    deploymentId: 1,
    baseSha: "a".repeat(40),
    sha: "b".repeat(40),
  };
  const files = filesFromUnifiedDiff(input.diff);
  const release = releaseFromComparison(job, {
    status: "ahead",
    total_commits: 1,
    commits: [{ commit: { message: "feat: promptfoo production-agent evaluation" } }],
    files,
  });
  if (!release) throw new Error("Eval diff produced no release evidence");
  const customers: Customer[] = input.customers.map(customer => ({
    id: customer.customer_id,
    feedback: customer.cancellation_reason,
    status: "canceled",
    marketingConsent: true,
    contactedReleaseIds: [],
  }));

  if (input.validateOnly) {
    process.stdout.write(JSON.stringify({ files: files.length, customers: customers.length, evidence: release.evidence.length }));
  } else {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is required");
    const result = await runAgent(apiKey, input.modelId || "google/gemini-3.8-flash", release, customers);
    process.stdout.write(JSON.stringify({
      decisions: result.assessment.decisions,
      tools: result.tools,
      excludedCustomers: result.excludedCustomers,
    }));
  }
}

main().catch(() => {
  console.error("Production agent evaluation failed. Check test data, dependencies, and provider configuration.");
  process.exitCode = 1;
});
