import { z } from "zod";
import {
  QUALITY_TIERS,
  REGION_KEYS,
  SERVICE_TYPES,
  URGENCY_LEVELS,
  type QuoteInput,
  type QualityTier,
  type RegionKey,
  type ServiceType,
  type Urgency
} from "./types.js";
import { getPricingRules } from "./calculator.js";
import { getDefaultQuoteInput } from "./default-inputs.js";

const flexibleTextOrNumber = z.union([z.string(), z.number()]);
const positiveProjectSizeSchema = z.coerce
  .number()
  .positive("Project size must be greater than zero.");

export const quoteToolInputShape = {
  serviceType: z.enum(SERVICE_TYPES).optional(),
  service_type: z.string().optional(),
  service: z.string().optional(),
  category: z.string().optional(),
  jobType: z.string().optional(),
  job_type: z.string().optional(),
  projectSize: positiveProjectSizeSchema.optional(),
  project_size: flexibleTextOrNumber.optional(),
  size: flexibleTextOrNumber.optional(),
  area: flexibleTextOrNumber.optional(),
  squareFeet: flexibleTextOrNumber.optional(),
  square_feet: flexibleTextOrNumber.optional(),
  sqFt: flexibleTextOrNumber.optional(),
  sq_ft: flexibleTextOrNumber.optional(),
  sqft: flexibleTextOrNumber.optional(),
  acreage: flexibleTextOrNumber.optional(),
  location: z.string().trim().optional(),
  city: z.string().trim().optional(),
  siteLocation: z.string().trim().optional(),
  site_location: z.string().trim().optional(),
  region: z.string().trim().optional(),
  market: z.string().trim().optional(),
  regionalPricing: z.string().trim().optional(),
  regional_pricing: z.string().trim().optional(),
  qualityTier: z.enum(QUALITY_TIERS).optional(),
  quality_tier: z.string().optional(),
  tier: z.string().optional(),
  quality: z.string().optional(),
  urgency: z.enum(URGENCY_LEVELS).optional(),
  schedule: z.string().optional(),
  timing: z.string().optional(),
  extras: z.array(z.string()).default([]),
  selectedExtras: z.array(z.string()).optional(),
  selected_extras: z.array(z.string()).optional()
};

const serviceTypeSchema = z.enum(SERVICE_TYPES);
const qualityTierSchema = z.enum(QUALITY_TIERS);
const urgencySchema = z.enum(URGENCY_LEVELS);

export const quoteInputSchema = z.object({
  serviceType: serviceTypeSchema,
  projectSize: positiveProjectSizeSchema,
  location: z.string().trim().min(1, "Location is required."),
  region: z.string().trim().min(1, "Region is required."),
  qualityTier: qualityTierSchema,
  urgency: urgencySchema,
  extras: z.array(z.string()).default([])
});

export type RawQuoteInput = z.input<typeof quoteInputSchema> | Record<string, unknown>;

const projectSizeKeys = [
  "projectSize",
  "project_size",
  "size",
  "area",
  "squareFeet",
  "square_feet",
  "sqFt",
  "sq_ft",
  "sqft",
  "acreage"
] as const;

const serviceTypeKeys = [
  "serviceType",
  "service_type",
  "service",
  "category",
  "jobType",
  "job_type"
] as const;

const locationKeys = ["location", "city", "siteLocation", "site_location"] as const;
const regionKeys = ["region", "market", "regionalPricing", "regional_pricing"] as const;
const qualityTierKeys = ["qualityTier", "quality_tier", "tier", "quality"] as const;
const urgencyKeys = ["urgency", "schedule", "timing"] as const;
const extrasKeys = ["extras", "selectedExtras", "selected_extras"] as const;

const serviceTypeAliases: Record<string, ServiceType> = {
  "paver patio": "paver_patio",
  patio: "paver_patio",
  pavers: "paver_patio",
  hardscape: "paver_patio",
  "lawn makeover": "lawn_makeover",
  lawn: "lawn_makeover",
  landscaping: "lawn_makeover",
  "pressure washing": "pressure_washing",
  "pressure wash": "pressure_washing",
  "driveway washing": "pressure_washing",
  "driveway wash": "pressure_washing"
};

const urgencyAliases: Record<string, Urgency> = {
  asap: "urgent",
  rush: "urgent",
  urgent: "urgent",
  emergency: "urgent",
  weekend: "weekend",
  standard: "standard",
  normal: "standard"
};

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readFirstValue(source: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      return source[key];
    }
  }

  return undefined;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replaceAll("-", " ").replaceAll("_", " ");
}

function normalizeServiceType(value: unknown): ServiceType | null {
  if (typeof value !== "string") {
    return serviceTypeSchema.safeParse(value).success ? (value as ServiceType) : null;
  }

  const direct = serviceTypeSchema.safeParse(value);
  if (direct.success) {
    return direct.data;
  }

  return serviceTypeAliases[normalizeKey(value)] ?? null;
}

function normalizeQualityTier(value: unknown): QualityTier | null {
  if (typeof value !== "string") {
    return qualityTierSchema.safeParse(value).success ? (value as QualityTier) : null;
  }

  const direct = qualityTierSchema.safeParse(value);
  if (direct.success) {
    return direct.data;
  }

  const normalized = normalizeKey(value);
  return QUALITY_TIERS.includes(normalized as QualityTier) ? (normalized as QualityTier) : null;
}

function normalizeUrgency(value: unknown): Urgency | null {
  if (typeof value !== "string") {
    return urgencySchema.safeParse(value).success ? (value as Urgency) : null;
  }

  const direct = urgencySchema.safeParse(value);
  if (direct.success) {
    return direct.data;
  }

  return urgencyAliases[normalizeKey(value)] ?? null;
}

function parseProjectSize(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  const fractionMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    return denominator === 0 ? null : numerator / denominator;
  }

  const directValue = Number(trimmed.replaceAll(",", ""));
  if (Number.isFinite(directValue)) {
    return directValue;
  }

  const numberMatch = trimmed.match(/\d+(?:,\d{3})*(?:\.\d+)?|\.\d+/);
  return numberMatch ? Number(numberMatch[0].replaceAll(",", "")) : null;
}

function normalizeExtras(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeRawQuoteInput(input: RawQuoteInput): Record<string, unknown> {
  if (!isRecord(input)) {
    return {};
  }

  const normalized: Record<string, unknown> = { ...input };
  const serviceType = normalizeServiceType(readFirstValue(input, serviceTypeKeys));

  if (serviceType) {
    normalized.serviceType = serviceType;
  }

  const defaultInput = serviceType ? getDefaultQuoteInput(serviceType) : null;
  const projectSize = parseProjectSize(readFirstValue(input, projectSizeKeys));
  if (projectSize !== null) {
    normalized.projectSize = projectSize;
  }

  const location = readFirstValue(input, locationKeys);
  if (typeof location === "string" && location.trim()) {
    normalized.location = location.trim();
  } else if (defaultInput) {
    normalized.location = defaultInput.location;
  }

  const region = readFirstValue(input, regionKeys);
  if (typeof region === "string" && region.trim()) {
    normalized.region = region.trim();
  } else if (defaultInput) {
    normalized.region = defaultInput.region;
  }

  const qualityTier = normalizeQualityTier(readFirstValue(input, qualityTierKeys));
  if (qualityTier) {
    normalized.qualityTier = qualityTier;
  } else if (defaultInput) {
    normalized.qualityTier = defaultInput.qualityTier;
  }

  const urgency = normalizeUrgency(readFirstValue(input, urgencyKeys));
  if (urgency) {
    normalized.urgency = urgency;
  } else if (defaultInput) {
    normalized.urgency = defaultInput.urgency;
  }

  normalized.extras = normalizeExtras(readFirstValue(input, extrasKeys));
  return normalized;
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
  const parsed = quoteInputSchema.parse(normalizeRawQuoteInput(input));
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
