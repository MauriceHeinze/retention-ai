const { spawn } = require("node:child_process");
const { resolve } = require("node:path");

class ProductionAgentProvider {
  constructor(options) {
    this.providerId = options.id || "production-agent";
    this.config = options.config || {};
  }

  id() {
    return this.providerId;
  }

  async callApi(_prompt, context) {
    if (!process.env.OPENROUTER_API_KEY) {
      return { error: "OPENROUTER_API_KEY is required to run the production agent eval" };
    }
    const backendDirectory = resolve(__dirname, "../../backend");
    const runner = resolve(__dirname, "run-production-agent.ts");
    const payload = JSON.stringify({
      diff: context.vars.diff,
      customers: JSON.parse(context.vars.customers),
      modelId: process.env.OPENROUTER_MODEL || this.config.modelId,
    });

    return new Promise(resolveResult => {
      const child = spawn(process.execPath, ["--import", "tsx", runner], {
        cwd: backendDirectory,
        env: process.env,
        stdio: ["pipe", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", chunk => {
        stdout += chunk;
        if (stdout.length > 2_000_000) child.kill();
      });
      child.stderr.on("data", chunk => {
        stderr += chunk;
        if (stderr.length > 20_000) child.kill();
      });
      child.on("error", () => resolveResult({ error: "Unable to start the production agent eval" }));
      child.on("close", code => {
        if (code !== 0) {
          resolveResult({ error: stderr.trim() || "Production agent eval failed" });
          return;
        }
        resolveResult({ output: stdout.trim() });
      });
      child.stdin.end(payload);
    });
  }
}

module.exports = ProductionAgentProvider;
