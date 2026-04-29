import { z } from "zod";
import {
  QUALITY_TIERS,
  REGION_KEYS,
  SERVICE_TYPES,
  URGENCY_LEVELS,
  type QuoteInput,
  type RegionKey,
  type ServiceType
} from "./types.js";
import { getPricingRules } from "./calculator.js";
import { getDefaultQuoteInput } from "./default-inputs.js";

export const quoteToolInputShape = {
  serviceType: z.enum(SERVICE_TYPES),
  projectSize: z.coerce.number().positive("Project size must be greater than zero."),
  location: z.string().trim().min(1, "Location is required."),
  region: z.string().trim().min(1, "Region is required."),
  qualityTier: z.enum(QUALITY_TIERS),
  urgency: z.enum(URGENCY_LEVELS),
  extras: z.array(z.string()).default([])
};

const serviceTypeSchema = z.enum(SERVICE_TYPES);
const qualityTierSchema = z.enum(QUALITY_TIERS);
const urgencySchema = z.enum(URGENCY_LEVELS);

export const quoteInputSchema = z.object(quoteToolInputShape);

export type RawQuoteInput = z.input<typeof quoteInputSchema>;

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

function normalizeLocation(serviceType: ServiceType, location: string): string {
  const trimmed = location.trim();
  if (placeholderLocations.has(trimmed.toLowerCase())) {
    return getDefaultQuoteInput(serviceType).location;
  }

  return trimmed;
}

export function normalizeRegion(region: string): RegionKey {
  const key = region.trim().toLowerCase();
  return regionAliases[key] ?? "default";
}

export function validateExtras(serviceType: ServiceType, extras: string[]): string[] {
  const rules = getPricingRules().services[serviceType];
  const validKeys = new Set(Object.keys(rules.optionalExtras));

  for (const extra of extras) {
    if (!validKeys.has(extra)) {
      throw new Error(`Unsupported extra "${extra}" for service "${serviceType}".`);
    }
  }

  return extras;
}

export function parseQuoteInput(input: RawQuoteInput): QuoteInput {
  const parsed = quoteInputSchema.parse(input);
  const defaultInput = getDefaultQuoteInput(parsed.serviceType);
  const normalizedLocation = normalizeLocation(parsed.serviceType, parsed.location);
  const requestedRegion = parsed.region.trim().toLowerCase();
  const normalizedRegion = placeholderLocations.has(requestedRegion)
    ? defaultInput.region
    : REGION_KEYS.includes(parsed.region as RegionKey)
      ? (parsed.region as RegionKey)
      : normalizeRegion(parsed.region);

  return {
    serviceType: parsed.serviceType,
    projectSize: parsed.projectSize,
    location: normalizedLocation,
    region: normalizedRegion,
    qualityTier: parsed.qualityTier,
    urgency: parsed.urgency,
    extras: validateExtras(parsed.serviceType, parsed.extras)
  };
}
