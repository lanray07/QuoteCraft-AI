import { formatCurrency, formatRegionLabel } from "./display-formatters.js";
import type { QuoteEstimate, QuoteInput, ServiceTemplateConfig } from "./types.js";
import { readJsonFile } from "./calculator.js";

let templateCache: ServiceTemplateConfig | null = null;

export async function getServiceTemplates(): Promise<ServiceTemplateConfig> {
  if (!templateCache) {
    templateCache = await readJsonFile<ServiceTemplateConfig>("service-templates.json");
  }

  return templateCache;
}

export async function buildClientFacingQuoteText(
  input: QuoteInput,
  estimate: QuoteEstimate
): Promise<string> {
  const templates = await getServiceTemplates();
  const template = templates[input.serviceType];
  const scope = template.scopeTemplate.replace("{size}", String(input.projectSize));
  const assumptions = estimate.assumptions.slice(0, 2).join(" ");

  return [
    `Thanks for the opportunity to quote ${scope} in ${input.location}.`,
    `Based on the details provided, the expected investment range is ${formatCurrency(estimate.lowEstimate)} to ${formatCurrency(estimate.highEstimate)}, with a working estimate of ${formatCurrency(estimate.workingEstimate)}.`,
    `This pricing assumes ${assumptions.toLowerCase()}`,
    template.clientNote
  ].join(" ");
}

export function buildAuthoritativeQuoteSummary(estimate: QuoteEstimate): string {
  return [
    `Authoritative quote totals for ${estimate.serviceName} in ${estimate.input.location}:`,
    `Low estimate: ${formatCurrency(estimate.lowEstimate)}`,
    `Working estimate: ${formatCurrency(estimate.workingEstimate)}`,
    `High estimate: ${formatCurrency(estimate.highEstimate)}`,
    `Materials: ${formatCurrency(estimate.materialEstimate)}`,
    `Labor: ${formatCurrency(estimate.laborEstimate)}`,
    `Markup: ${formatCurrency(estimate.markupAmount)}`,
    `Regional adjustment: ${formatCurrency(estimate.regionalAdjustment)}`,
    `Urgency adjustment: ${formatCurrency(estimate.urgencyAdjustment)}`,
    `Extras: ${formatCurrency(estimate.extrasTotal)}`,
    `Use these figures exactly as returned; the working estimate already includes markup, regional pricing, urgency, and extras.`
  ].join("\n");
}

export { formatCurrency, formatRegionLabel };
