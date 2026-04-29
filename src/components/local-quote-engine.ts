import markupConfig from "../data/markup-config.json" with { type: "json" };
import serviceTemplates from "../data/service-templates.json" with { type: "json" };
import type {
  MarkupConfig,
  OptionalExtraRule,
  QuoteEstimate,
  QuoteExplanation,
  QuoteInput,
  QuoteLineItem,
  RegionKey,
  ServiceTemplateConfig,
  ServiceType
} from "../lib/types.js";
import { buildAssumptions, buildExplanationSummary } from "../lib/assumptions.js";
import { formatCurrency } from "../lib/display-formatters.js";
import { defaultQuoteInputsByService } from "../lib/default-inputs.js";
import { widgetPricingRules, widgetRegions } from "./widget-config.js";

const placeholderLocations = new Set([
  "",
  "not specified",
  "unknown",
  "unknown location",
  "default",
  "n/a",
  "na",
  "none",
  "unspecified"
]);

const regionAliases: Record<string, RegionKey> = {
  default: "default",
  london: "london",
  "greater london": "london",
  southeast: "south_east",
  "south east": "south_east",
  south_east: "south_east",
  midlands: "midlands",
  northwest: "north_west",
  "north west": "north_west",
  north_west: "north_west"
};

function roundMoney(value: number): number {
  return Math.round(value);
}

function getUrgencyMultiplier(markup: MarkupConfig, urgency: QuoteInput["urgency"]): number {
  switch (urgency) {
    case "urgent":
      return markup.urgentJobMultiplier;
    case "weekend":
      return markup.weekendJobMultiplier;
    default:
      return 1;
  }
}

function computeExtraCost(extra: OptionalExtraRule, size: number): number {
  return extra.pricingType === "per_unit" ? size * extra.amount : extra.amount;
}

function normalizeLocation(serviceType: ServiceType, location: string): string {
  const trimmed = location.trim();
  if (placeholderLocations.has(trimmed.toLowerCase())) {
    return defaultQuoteInputsByService[serviceType].location;
  }

  return trimmed;
}

function normalizeRegion(serviceType: ServiceType, region: string): RegionKey {
  const trimmed = region.trim().toLowerCase();
  if (placeholderLocations.has(trimmed)) {
    return defaultQuoteInputsByService[serviceType].region;
  }

  return regionAliases[trimmed] ?? "default";
}

function normalizeInput(input: QuoteInput): QuoteInput {
  return {
    ...input,
    location: normalizeLocation(input.serviceType, input.location),
    region: normalizeRegion(input.serviceType, input.region)
  };
}

function buildClientFacingQuoteText(
  input: QuoteInput,
  estimate: QuoteEstimate
): string {
  const templates = serviceTemplates as ServiceTemplateConfig;
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

function buildAuthoritativeQuoteSummary(estimate: QuoteEstimate): string {
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

export function generateLocalQuote(input: QuoteInput): QuoteEstimate {
  const normalized = normalizeInput(input);
  const rules = widgetPricingRules.services[normalized.serviceType];
  const regionalMultiplier =
    widgetRegions[normalized.region]?.multiplier ?? widgetRegions.default.multiplier;
  const markup = markupConfig as MarkupConfig;
  const urgencyMultiplier = getUrgencyMultiplier(markup, normalized.urgency);

  const materialBase = roundMoney(
    rules.baseMaterialCostByTier[normalized.qualityTier] * normalized.projectSize
  );
  const laborBase = roundMoney(
    rules.baseLaborCostByTier[normalized.qualityTier] * normalized.projectSize
  );

  const selectedExtras = normalized.extras.map((key) => {
    const extraRule = rules.optionalExtras[key];
    const amount = roundMoney(computeExtraCost(extraRule, normalized.projectSize));

    return {
      key,
      label: extraRule.label,
      amount
    };
  });

  const extrasTotal = roundMoney(selectedExtras.reduce((sum, item) => sum + item.amount, 0));
  const baseDirectCost = roundMoney(materialBase + laborBase + extrasTotal);
  const minimumApplied = baseDirectCost < rules.minimumJobTotal;
  const subtotalAfterMinimum = minimumApplied ? rules.minimumJobTotal : baseDirectCost;
  const markupAmount = roundMoney(subtotalAfterMinimum * markup.defaultMarkupPercent);
  const beforeRegional = roundMoney(subtotalAfterMinimum + markupAmount);
  const regionalAdjustment = roundMoney(beforeRegional * (regionalMultiplier - 1));
  const afterRegional = roundMoney(beforeRegional + regionalAdjustment);
  const urgencyAdjustment = roundMoney(afterRegional * (urgencyMultiplier - 1));
  const midEstimate = roundMoney(afterRegional + urgencyAdjustment);
  const lowEstimate = roundMoney(midEstimate * rules.lowRangeMultiplier);
  const highEstimate = roundMoney(midEstimate * rules.highRangeMultiplier);
  const extraAssumptions = normalized.extras.map((key) => rules.optionalExtras[key].assumption);
  const assumptions = buildAssumptions(normalized, rules, extraAssumptions, minimumApplied);

  const formulaBreakdown: QuoteLineItem[] = [
    {
      key: "material",
      label: "Materials",
      value: materialBase,
      detail: `${formatCurrency(rules.baseMaterialCostByTier[normalized.qualityTier])} x ${normalized.projectSize} ${rules.unit}`
    },
    {
      key: "labor",
      label: "Labor",
      value: laborBase,
      detail: `${formatCurrency(rules.baseLaborCostByTier[normalized.qualityTier])} x ${normalized.projectSize} ${rules.unit}`
    },
    {
      key: "extras",
      label: "Extras",
      value: extrasTotal,
      detail: normalized.extras.length ? `${normalized.extras.length} selected extra(s)` : "No extras selected"
    },
    {
      key: "markup",
      label: "Markup",
      value: markupAmount,
      detail: `${Math.round(markup.defaultMarkupPercent * 100)}% default markup`
    },
    {
      key: "regional",
      label: "Regional adjustment",
      value: regionalAdjustment,
      detail: `${regionalMultiplier.toFixed(2)}x regional multiplier`
    },
    {
      key: "urgency",
      label: "Urgency adjustment",
      value: urgencyAdjustment,
      detail: `${urgencyMultiplier.toFixed(2)}x urgency multiplier`
    }
  ];

  const estimate: QuoteEstimate = {
    input: normalized,
    serviceName: rules.displayName,
    unitLabel: rules.sizeLabel,
    lowEstimate,
    midEstimate,
    workingEstimate: midEstimate,
    highEstimate,
    materialEstimate: materialBase,
    laborEstimate: laborBase,
    markupAmount,
    regionalAdjustment,
    urgencyAdjustment,
    extrasTotal,
    minimumApplied,
    selectedExtras,
    assumptions,
    suggestedUpsells: rules.upsells,
    formulaBreakdown,
    clientFacingQuoteText: "",
    authoritativeSummaryText: ""
  };

  estimate.clientFacingQuoteText = buildClientFacingQuoteText(normalized, estimate);
  estimate.authoritativeSummaryText = buildAuthoritativeQuoteSummary(estimate);
  return estimate;
}

export function explainLocalQuote(estimate: QuoteEstimate): QuoteExplanation {
  return {
    summary: buildExplanationSummary(estimate),
    steps: estimate.formulaBreakdown.map(
      (line) => `${line.label}: ${formatCurrency(line.value)} (${line.detail})`
    ),
    formulaBreakdown: estimate.formulaBreakdown,
    assumptions: estimate.assumptions
  };
}
