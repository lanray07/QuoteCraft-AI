export const SERVICE_TYPES = [
  "paver_patio",
  "lawn_makeover",
  "pressure_washing"
] as const;

export const QUALITY_TIERS = ["budget", "standard", "premium"] as const;
export const URGENCY_LEVELS = ["standard", "urgent", "weekend"] as const;
export const REGION_KEYS = [
  "default",
  "london",
  "south_east",
  "midlands",
  "north_west"
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];
export type QualityTier = (typeof QUALITY_TIERS)[number];
export type Urgency = (typeof URGENCY_LEVELS)[number];
export type RegionKey = (typeof REGION_KEYS)[number];

export interface QuoteInput {
  serviceType: ServiceType;
  projectSize: number;
  location: string;
  region: RegionKey;
  qualityTier: QualityTier;
  urgency: Urgency;
  extras: string[];
}

export interface OptionalExtraRule {
  label: string;
  pricingType: "flat" | "per_unit";
  amount: number;
  assumption: string;
}

export interface ServicePricingRule {
  displayName: string;
  unit: "sq_ft" | "acre";
  sizeLabel: string;
  baseMaterialCostByTier: Record<QualityTier, number>;
  baseLaborCostByTier: Record<QualityTier, number>;
  minimumJobTotal: number;
  lowRangeMultiplier: number;
  highRangeMultiplier: number;
  upsells: string[];
  defaultAssumptions: string[];
  optionalExtras: Record<string, OptionalExtraRule>;
}

export interface PricingRulesConfig {
  services: Record<ServiceType, ServicePricingRule>;
}

export interface RegionalMultiplierEntry {
  label: string;
  multiplier: number;
}

export type RegionalMultipliersConfig = Record<RegionKey, RegionalMultiplierEntry>;

export interface MarkupConfig {
  defaultMarkupPercent: number;
  urgentJobMultiplier: number;
  weekendJobMultiplier: number;
}

export interface ServiceTemplate {
  scopeTemplate: string;
  clientNote: string;
}

export type ServiceTemplateConfig = Record<ServiceType, ServiceTemplate>;

export interface QuoteLineItem {
  key: string;
  label: string;
  value: number;
  detail: string;
}

export interface QuoteEstimate {
  input: QuoteInput;
  serviceName: string;
  unitLabel: string;
  lowEstimate: number;
  midEstimate: number;
  highEstimate: number;
  materialEstimate: number;
  laborEstimate: number;
  markupAmount: number;
  regionalAdjustment: number;
  urgencyAdjustment: number;
  extrasTotal: number;
  minimumApplied: boolean;
  selectedExtras: Array<{ key: string; label: string; amount: number }>;
  assumptions: string[];
  suggestedUpsells: string[];
  formulaBreakdown: QuoteLineItem[];
  clientFacingQuoteText: string;
}

export interface QuoteExplanation {
  summary: string;
  steps: string[];
  formulaBreakdown: QuoteLineItem[];
  assumptions: string[];
}

export interface QuoteToolResultMeta {
  formDefaults: QuoteInput;
  explanation: QuoteExplanation;
}
