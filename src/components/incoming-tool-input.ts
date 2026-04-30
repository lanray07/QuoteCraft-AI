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

function isServiceType(value: unknown): value is ServiceType {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(defaultQuoteInputsByService, value)
  );
}

export function extractToolArguments(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (isRecord(payload.arguments)) {
    return payload.arguments;
  }

  return payload;
}

export function coerceIncomingQuoteInput(
  payload: unknown,
  fallback: QuoteInput
): QuoteInput | null {
  const args = extractToolArguments(payload);
  if (!args) {
    return null;
  }

  const nextServiceType = isServiceType(args.serviceType)
    ? args.serviceType
    : fallback.serviceType;

  const base =
    fallback.serviceType === nextServiceType
      ? fallback
      : defaultQuoteInputsByService[nextServiceType];

  const projectSize =
    typeof args.projectSize === "number"
      ? args.projectSize
      : typeof args.projectSize === "string"
        ? Number(args.projectSize)
        : base.projectSize;

  if (!Number.isFinite(projectSize) || projectSize <= 0) {
    return null;
  }

  const qualityTier =
    typeof args.qualityTier === "string" &&
    QUALITY_TIERS.includes(args.qualityTier as QualityTier)
      ? (args.qualityTier as QualityTier)
      : base.qualityTier;

  const urgency =
    typeof args.urgency === "string" &&
    URGENCY_LEVELS.includes(args.urgency as Urgency)
      ? (args.urgency as Urgency)
      : base.urgency;

  const location =
    typeof args.location === "string" && args.location.trim()
      ? args.location.trim()
      : base.location;

  const validExtras = new Set(
    Object.keys(widgetPricingRules.services[nextServiceType].optionalExtras)
  );
  const extras = Array.isArray(args.extras)
    ? args.extras.filter(
        (item): item is string => typeof item === "string" && validExtras.has(item)
      )
    : base.extras;

  const normalizedRegion =
    typeof args.region === "string" && args.region.trim()
      ? normalizeRegion(args.region)
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
