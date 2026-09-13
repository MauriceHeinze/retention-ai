import assert from "node:assert/strict";
import { test } from "node:test";
import { customers, release, type Customer } from "./fixtures.js";
import { canContact, validateAssessment, type Assessment } from "./policy.js";

const customer: Customer = customers[0]!;
const valid: Assessment = {
  decisions: [{
    customerId: customer.id,
    decision: "match",
    reason: "Manual CSV export meets the download request",
    customerEvidence: "download my reports as CSV files",
    releaseEvidence: "Manual CSV export is now available on all plans.",
    draft: { subject: "CSV downloads are here", body: "You can now download reports as CSV files." },
  }],
};

test("exclude opt-outs, active customers, and duplicate outreach", () => {
  assert.equal(canContact(customer, release.id), true);
  assert.equal(canContact({ ...customer, marketingConsent: false }, release.id), false);
  assert.equal(canContact({ ...customer, status: "active" }, release.id), false);
  assert.equal(canContact({ ...customer, contactedReleaseIds: [release.id] }, release.id), false);
});

test("accept evidence copied from the supplied sources", () => {
  assert.deepEqual(validateAssessment(valid, [customer], release.evidence), valid);
});

test("reject invented evidence, unknown customers, and drafts for non-matches", () => {
  for (const changes of [
    { customerEvidence: "I wanted automatic export" },
    { releaseEvidence: "Scheduling is now available" },
    { customerId: "unknown-customer" },
    { decision: "no_match" as const },
    { draft: null },
  ]) {
    const assessment = { decisions: [{ ...valid.decisions[0]!, ...changes }] };
    assert.throws(() => validateAssessment(assessment, [customer], release.evidence));
  }
});

test("reject missing or repeated decisions", () => {
  assert.throws(() => validateAssessment({ decisions: [] }, [customer], release.evidence));
  assert.throws(() => validateAssessment({ decisions: [valid.decisions[0]!, valid.decisions[0]!] }, [customer, { ...customer, id: "second" }], release.evidence));
});

test("missing feedback requires review and cannot produce a draft", () => {
  const missingFeedback = { ...customer, feedback: null };
  assert.throws(() => validateAssessment(valid, [missingFeedback], release.evidence));
  const assessment: Assessment = { decisions: [{
    ...valid.decisions[0]!, customerEvidence: null, decision: "needs_review", draft: null,
  }] };
  assert.deepEqual(validateAssessment(assessment, [missingFeedback], release.evidence), assessment);
});
