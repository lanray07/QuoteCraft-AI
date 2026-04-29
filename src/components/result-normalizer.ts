import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { QuoteEstimate, QuoteExplanation, QuoteInput } from "../lib/types.js";

export interface ToolPayload {
  quote?: QuoteEstimate;
  explanation?: QuoteExplanation;
}

export interface ToolMeta {
  formDefaults?: QuoteInput;
  quote?: QuoteEstimate;
  explanation?: QuoteExplanation;
}

export interface NormalizedToolResult {
  quote: QuoteEstimate | null;
  explanation: QuoteExplanation | null;
  formDefaults: QuoteInput | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isQuoteInput(value: unknown): value is QuoteInput {
  return (
    isRecord(value) &&
    typeof value.serviceType === "string" &&
    typeof value.projectSize === "number" &&
    typeof value.location === "string" &&
    typeof value.region === "string" &&
    typeof value.qualityTier === "string" &&
    typeof value.urgency === "string" &&
    Array.isArray(value.extras)
  );
}

function isQuoteEstimate(value: unknown): value is QuoteEstimate {
  return (
    isRecord(value) &&
    isQuoteInput(value.input) &&
    typeof value.serviceName === "string" &&
    typeof value.lowEstimate === "number" &&
    typeof value.midEstimate === "number" &&
    typeof value.workingEstimate === "number" &&
    typeof value.highEstimate === "number"
  );
}

function isQuoteExplanation(value: unknown): value is QuoteExplanation {
  return (
    isRecord(value) &&
    typeof value.summary === "string" &&
    Array.isArray(value.steps) &&
    Array.isArray(value.assumptions) &&
    Array.isArray(value.formulaBreakdown)
  );
}

function scanNode(
  node: unknown,
  seen: WeakSet<object>,
  result: NormalizedToolResult
): void {
  if (result.quote && result.explanation && result.formDefaults) {
    return;
  }

  if (isQuoteEstimate(node) && !result.quote) {
    result.quote = node;
  }

  if (isQuoteExplanation(node) && !result.explanation) {
    result.explanation = node;
  }

  if (isQuoteInput(node) && !result.formDefaults) {
    result.formDefaults = node;
  }

  if (!isRecord(node)) {
    return;
  }

  if (seen.has(node)) {
    return;
  }

  seen.add(node);

  const nextNodes = Array.isArray(node) ? node : Object.values(node);
  for (const nextNode of nextNodes) {
    scanNode(nextNode, seen, result);
  }
}

export function normalizeToolResult(result: CallToolResult | Record<string, unknown>): NormalizedToolResult {
  const normalized: NormalizedToolResult = {
    quote: null,
    explanation: null,
    formDefaults: null
  };

  scanNode(result, new WeakSet<object>(), normalized);
  return normalized;
}
