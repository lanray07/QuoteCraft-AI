import type { QuoteInput, ServiceType } from "./types.js";

export const defaultQuoteInputsByService: Record<ServiceType, QuoteInput> = {
  paver_patio: {
    serviceType: "paver_patio",
    projectSize: 500,
    location: "London",
    region: "london",
    qualityTier: "standard",
    urgency: "standard",
    extras: []
  },
  lawn_makeover: {
    serviceType: "lawn_makeover",
    projectSize: 0.25,
    location: "Guildford",
    region: "south_east",
    qualityTier: "premium",
    urgency: "standard",
    extras: []
  },
  pressure_washing: {
    serviceType: "pressure_washing",
    projectSize: 1200,
    location: "Manchester",
    region: "north_west",
    qualityTier: "standard",
    urgency: "urgent",
    extras: []
  }
};

export function getDefaultQuoteInput(serviceType: ServiceType): QuoteInput {
  return defaultQuoteInputsByService[serviceType];
}
