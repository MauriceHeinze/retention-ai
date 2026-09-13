import assert from "node:assert/strict";
import { test } from "node:test";
import { runAgent } from "./agent.js";
import { customers, release } from "./fixtures.js";

test("reject staging and failed deployments before contacting the model", async () => {
  for (const changes of [{ environment: "staging" }, { status: "failure" }, { status: "pending" }]) {
    await assert.rejects(runAgent("unused", "unused", { ...release, ...changes }, customers), {
      message: "Only successful production deployments can be assessed",
    });
  }
});
