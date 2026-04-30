import { defaultQuoteInputsByService } from "../lib/default-inputs.js";
import {
  QUALITY_TIERS,
  URGENCY_LEVELS,
  type QuoteInput,
  type QualityTier,
  type ServiceType,
  type Urgency
} from "../lib/types.js";
import { normalizeRegion } from "../lib/validators.js";
import { widgetPricingRules } from "./widget-config.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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
  "lawn makeover": "lawn_makeover",
  lawn: "lawn_makeover",
  landscaping: "lawn_makeover",
  "pressure washing": "pressure_washing",
  "pressure wash": "pressure_washing",
  "driveway washing": "pressure_washing",
  "driveway wash": "pressure_washing"
};

const quoteInputKeys = new Set<string>([
  ...projectSizeKeys,
  ...serviceTypeKeys,
  ...locationKeys,
  ...regionKeys,
  ...qualityTierKeys,
  ...urgencyKeys,
  ...extrasKeys
]);

function isServiceType(value: unknown): value is ServiceType {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(defaultQuoteInputsByService, value)
  );
}

function normalizeServiceType(value: unknown): ServiceType | null {
  if (isServiceType(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase().replaceAll("-", " ").replaceAll("_", " ");
  return serviceTypeAliases[normalized] ?? null;
}

function parseProjectSize(value: unknown, fallback: number): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  const fractionMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    return denominator === 0 ? Number.NaN : numerator / denominator;
  }

  const directValue = Number(trimmed.replaceAll(",", ""));
  if (Number.isFinite(directValue)) {
    return directValue;
  }

  const numberMatch = trimmed.match(/\d+(?:,\d{3})*(?:\.\d+)?|\.\d+/);
  return numberMatch ? Number(numberMatch[0].replaceAll(",", "")) : Number.NaN;
}

function readFirstValue(
  source: Record<string, unknown>,
  keys: readonly string[]
): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      return source[key];
    }
  }

  return undefined;
}

function hasQuoteInputKey(value: Record<string, unknown>): boolean {
  return Object.keys(value).some((key) => quoteInputKeys.has(key));
}

function hasProjectSize(value: Record<string, unknown>): boolean {
  return projectSizeKeys.some((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function parseRecordString(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function candidateScore(value: Record<string, unknown>): number {
  if (!hasQuoteInputKey(value)) {
    return -1;
  }

  let score = 0;
  if (hasProjectSize(value)) {
    score += 4;
  }
  if (readFirstValue(value, serviceTypeKeys) !== undefined) {
    score += 2;
  }
  if (readFirstValue(value, locationKeys) !== undefined) {
    score += 1;
  }
  if (readFirstValue(value, regionKeys) !== undefined) {
    score += 1;
  }

  return score;
}

function findBestArguments(
  payload: unknown,
  seen = new WeakSet<object>(),
  depth = 0
): Record<string, unknown> | null {
  if (depth > 6) {
    return null;
  }

  const parsedString = parseRecordString(payload);
  const value = parsedString ?? payload;

  if (!isRecord(value)) {
    return null;
  }

  if (seen.has(value)) {
    return null;
  }

  seen.add(value);

  let best: Record<string, unknown> | null = candidateScore(value) >= 0 ? value : null;
  let bestScore = best ? candidateScore(best) : -1;

  const preferredKeys = [
    "arguments",
    "input",
    "toolInput",
    "tool_input",
    "params",
    "parameters",
    "structuredContent",
    "_meta",
    "quote",
    "formDefaults",
    "data"
  ];

  const children = new Set<unknown>();
  for (const key of preferredKeys) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      children.add(value[key]);
    }
  }

  for (const child of Object.values(value)) {
    children.add(child);
  }

  for (const child of children) {
    const candidate = findBestArguments(child, seen, depth + 1);
    if (!candidate) {
      continue;
    }

    const score = candidateScore(candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

export function extractToolArguments(payload: unknown): Record<string, unknown> | null {
  return findBestArguments(payload);
}

export function coerceIncomingQuoteInput(
  payload: unknown,
  fallback: QuoteInput
): QuoteInput | null {
  const args = extractToolArguments(payload);
  if (!args) {
    return null;
  }

  const serviceTypeValue = readFirstValue(args, serviceTypeKeys);
  const nextServiceType = normalizeServiceType(serviceTypeValue) ?? fallback.serviceType;

  const base =
    fallback.serviceType === nextServiceType
      ? fallback
      : defaultQuoteInputsByService[nextServiceType];

  const projectSizeValue = readFirstValue(args, projectSizeKeys);
  const projectSize = parseProjectSize(projectSizeValue, base.projectSize);

  if (!Number.isFinite(projectSize) || projectSize <= 0) {
    return null;
  }

  const qualityTier =
    typeof readFirstValue(args, qualityTierKeys) === "string" &&
    QUALITY_TIERS.includes(readFirstValue(args, qualityTierKeys) as QualityTier)
      ? (readFirstValue(args, qualityTierKeys) as QualityTier)
      : base.qualityTier;

  const urgency =
    typeof readFirstValue(args, urgencyKeys) === "string" &&
    URGENCY_LEVELS.includes(readFirstValue(args, urgencyKeys) as Urgency)
      ? (readFirstValue(args, urgencyKeys) as Urgency)
      : base.urgency;

  const locationValue = readFirstValue(args, locationKeys);
  const location =
    typeof locationValue === "string" && locationValue.trim()
      ? locationValue.trim()
      : base.location;

  const validExtras = new Set(
    Object.keys(widgetPricingRules.services[nextServiceType].optionalExtras)
  );
  const extrasValue = readFirstValue(args, extrasKeys);
  const extras = Array.isArray(extrasValue)
    ? extrasValue.filter(
        (item): item is string => typeof item === "string" && validExtras.has(item)
      )
    : base.extras;

  const regionValue = readFirstValue(args, regionKeys);
  const normalizedRegion =
    typeof regionValue === "string" && regionValue.trim()
      ? normalizeRegion(regionValue)
      : base.region;

  return {
    serviceType: nextServiceType,
    projectSize,
    location,
    region: normalizedRegion,
    qualityTier,
    urgency,
    extras
  };
}
