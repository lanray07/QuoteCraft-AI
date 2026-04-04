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
    `Based on the details provided, the expected investment range is ${formatCurrency(estimate.lowEstimate)} to ${formatCurrency(estimate.highEstimate)}, with a working estimate of ${formatCurrency(estimate.midEstimate)}.`,
    `This pricing assumes ${assumptions.toLowerCase()}`,
    template.clientNote
  ].join(" ");
}

export { formatCurrency, formatRegionLabel };
