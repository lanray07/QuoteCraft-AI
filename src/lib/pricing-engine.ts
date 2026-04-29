import { buildAssumptions, buildExplanationSummary } from "./assumptions.js";
import {
  formatCurrency,
  buildAuthoritativeQuoteSummary,
  buildClientFacingQuoteText
} from "./formatters.js";
import { getRegionalMultipliers } from "./regional-adjustments.js";
import {
  getMarkupConfig,
  getPricingRules,
  roundMoney
} from "./calculator.js";
import type {
  MarkupConfig,
  OptionalExtraRule,
  QuoteEstimate,
  QuoteExplanation,
  QuoteInput,
  QuoteLineItem,
  ServicePricingRule
} from "./types.js";

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

export async function generateDeterministicQuote(input: QuoteInput): Promise<QuoteEstimate> {
  const rules = getPricingRules().services[input.serviceType];
  const regionalConfig = await getRegionalMultipliers();
  const markupConfig = await getMarkupConfig();
  const regionalMultiplier = regionalConfig[input.region]?.multiplier ?? regionalConfig.default.multiplier;
  const urgencyMultiplier = getUrgencyMultiplier(markupConfig, input.urgency);

  const materialBase = roundMoney(
    rules.baseMaterialCostByTier[input.qualityTier] * input.projectSize
  );
  const laborBase = roundMoney(rules.baseLaborCostByTier[input.qualityTier] * input.projectSize);

  const selectedExtras = input.extras.map((key) => {
    const extraRule = rules.optionalExtras[key];
    const amount = roundMoney(computeExtraCost(extraRule, input.projectSize));

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
  const markupAmount = roundMoney(subtotalAfterMinimum * markupConfig.defaultMarkupPercent);
  const beforeRegional = roundMoney(subtotalAfterMinimum + markupAmount);
  const regionalAdjustment = roundMoney(beforeRegional * (regionalMultiplier - 1));
  const afterRegional = roundMoney(beforeRegional + regionalAdjustment);
  const urgencyAdjustment = roundMoney(afterRegional * (urgencyMultiplier - 1));
  const midEstimate = roundMoney(afterRegional + urgencyAdjustment);
  const lowEstimate = roundMoney(midEstimate * rules.lowRangeMultiplier);
  const highEstimate = roundMoney(midEstimate * rules.highRangeMultiplier);
  const extraAssumptions = input.extras.map((key) => rules.optionalExtras[key].assumption);
  const assumptions = buildAssumptions(input, rules, extraAssumptions, minimumApplied);

  const formulaBreakdown: QuoteLineItem[] = [
    {
      key: "material",
      label: "Materials",
      value: materialBase,
      detail: `${formatCurrency(rules.baseMaterialCostByTier[input.qualityTier])} x ${input.projectSize} ${rules.unit}`
    },
    {
      key: "labor",
      label: "Labor",
      value: laborBase,
      detail: `${formatCurrency(rules.baseLaborCostByTier[input.qualityTier])} x ${input.projectSize} ${rules.unit}`
    },
    {
      key: "extras",
      label: "Extras",
      value: extrasTotal,
      detail: input.extras.length ? `${input.extras.length} selected extra(s)` : "No extras selected"
    },
    {
      key: "markup",
      label: "Markup",
      value: markupAmount,
      detail: `${Math.round(markupConfig.defaultMarkupPercent * 100)}% default markup`
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
    input,
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

  estimate.clientFacingQuoteText = await buildClientFacingQuoteText(input, estimate);
  estimate.authoritativeSummaryText = buildAuthoritativeQuoteSummary(estimate);
  return estimate;
}

export function explainDeterministicQuote(estimate: QuoteEstimate): QuoteExplanation {
  return {
    summary: buildExplanationSummary(estimate),
    steps: estimate.formulaBreakdown.map(
      (line) => `${line.label}: ${formatCurrency(line.value)} (${line.detail})`
    ),
    formulaBreakdown: estimate.formulaBreakdown,
    assumptions: estimate.assumptions
  };
}
