import type { QuoteEstimate, QuoteInput, ServicePricingRule } from "./types.js";

export function buildAssumptions(
  input: QuoteInput,
  serviceRule: ServicePricingRule,
  extraAssumptions: string[],
  minimumApplied: boolean
): string[] {
  const assumptions = [
    ...serviceRule.defaultAssumptions,
    `Estimate is based on ${input.projectSize} ${serviceRule.unit === "sq_ft" ? "sq ft" : "acre(s)"} at the ${input.qualityTier} tier.`,
    `Regional pricing is mapped to ${input.region.replace("_", " ")} and urgency is set to ${input.urgency}.`,
    ...extraAssumptions
  ];

  if (minimumApplied) {
    assumptions.push("A service minimum was applied because the calculated subtotal fell below the minimum job size.");
  }

  return assumptions;
}

export function buildExplanationSummary(estimate: QuoteEstimate): string {
  return `${estimate.serviceName} pricing follows a deterministic formula: config-based material and labor rates, then markup, regional, urgency, and extra-item adjustments without any hidden AI pricing.`;
}
