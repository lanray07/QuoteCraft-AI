import pricingRules from "../data/pricing-rules.json" with { type: "json" };
import regionalMultipliers from "../data/regional-multipliers.json" with { type: "json" };
import { defaultQuoteInputsByService } from "../lib/default-inputs.js";
import type { QuoteInput, RegionKey, ServicePricingRule, ServiceType } from "../lib/types.js";

type PricingRulesJson = {
  services: Record<ServiceType, ServicePricingRule>;
};

export const widgetPricingRules = pricingRules as PricingRulesJson;
export const widgetRegions = regionalMultipliers as Record<
  RegionKey,
  { label: string; multiplier: number }
>;

export interface PresetDefinition {
  title: string;
  subtitle: string;
  input: QuoteInput;
}

export const presets: PresetDefinition[] = [
  {
    title: "500 sq ft paver patio",
    subtitle: "Standard tier with a border accent in London",
    input: {
      serviceType: "paver_patio",
      projectSize: 500,
      location: "London",
      region: "london",
      qualityTier: "standard",
      urgency: "standard",
      extras: ["border_accent"]
    }
  },
  {
    title: "1/4 acre lawn makeover",
    subtitle: "Premium finish with mulch beds in the South East",
    input: {
      serviceType: "lawn_makeover",
      projectSize: 0.25,
      location: "Guildford",
      region: "south_east",
      qualityTier: "premium",
      urgency: "standard",
      extras: ["mulch_beds"]
    }
  },
  {
    title: "Driveway + patio pressure washing",
    subtitle: "Urgent combined clean with degreasing and mildew treatment",
    input: {
      serviceType: "pressure_washing",
      projectSize: 1200,
      location: "Manchester",
      region: "north_west",
      qualityTier: "standard",
      urgency: "urgent",
      extras: ["degreasing", "mildew_treatment"]
    }
  }
];

export function getDefaultInput(): QuoteInput {
  return defaultQuoteInputsByService.paver_patio;
}
