import { z } from "zod";
import type { Customer } from "./types.js";

export const assessmentSchema = z.object({
  decisions: z.array(z.object({
    customerId: z.string(),
    decision: z.enum(["match", "no_match", "needs_review"]),
    reason: z.string().min(1),
    customerEvidence: z.string().nullable(),
    releaseEvidence: z.string().min(1),
    draft: z.object({
      subject: z.string().min(1).max(150),
      body: z.string().min(1).max(2000),
    }).nullable(),
  })),
});

export type Assessment = z.infer<typeof assessmentSchema>;

export function canContact(customer: Customer, releaseId: string): boolean {
  return customer.status === "canceled"
    && customer.marketingConsent
    && !customer.contactedReleaseIds.includes(releaseId);
}

export function validateAssessment(
  assessment: Assessment,
  candidates: Customer[],
  releaseEvidence: string,
): Assessment {
  const parsed = assessmentSchema.parse(assessment);
  const seen = new Set<string>();
  if (parsed.decisions.length !== candidates.length) {
    throw new Error("The assessment must cover every eligible customer");
  }
  for (const item of parsed.decisions) {
    const customer = candidates.find(candidate => candidate.id === item.customerId);
    if (!customer || seen.has(item.customerId)) {
      throw new Error("The assessment contains an unknown or duplicate customer");
    }
    seen.add(item.customerId);
    if (!releaseEvidence.includes(item.releaseEvidence)) {
      throw new Error("The release evidence does not match the source");
    }
    if (customer.feedback) {
      if (!item.customerEvidence || !customer.feedback.includes(item.customerEvidence)) {
        throw new Error("The customer evidence does not match the source");
      }
    } else if (item.customerEvidence !== null || item.decision !== "needs_review") {
      throw new Error("Missing feedback requires manual review");
    }
    if ((item.decision === "match") !== (item.draft !== null)) {
      throw new Error("Only matched customers can have email drafts");
    }
  }
  return parsed;
}
