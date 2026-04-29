import { describe, expect, test } from "vitest";
import { normalizeToolResult } from "../components/result-normalizer.js";

const quote = {
  input: {
    serviceType: "paver_patio",
    projectSize: 500,
    location: "London",
    region: "london",
    qualityTier: "standard",
    urgency: "standard",
    extras: []
  },
  serviceName: "Paver Patio",
  unitLabel: "sq ft",
  lowEstimate: 21137,
  midEstimate: 22975,
  workingEstimate: 22975,
  highEstimate: 25732,
  materialEstimate: 9000,
  laborEstimate: 7500,
  markupAmount: 2970,
  regionalAdjustment: 3505,
  urgencyAdjustment: 0,
  extrasTotal: 0,
  minimumApplied: false,
  selectedExtras: [],
  assumptions: [],
  suggestedUpsells: [],
  formulaBreakdown: [],
  clientFacingQuoteText: "text",
  authoritativeSummaryText: "summary"
};

const explanation = {
  summary: "summary",
  steps: ["a", "b"],
  formulaBreakdown: [],
  assumptions: ["x"]
};

describe("normalizeToolResult", () => {
  test("reads direct tool results", () => {
    const normalized = normalizeToolResult({
      structuredContent: {
        status: "quote_ready",
        quote
      },
      _meta: {
        formDefaults: quote.input
      }
    });

    expect(normalized.quote?.workingEstimate).toBe(22975);
    expect(normalized.formDefaults?.location).toBe("London");
    expect(normalized.explanation).toBeNull();
  });

  test("reads wrapped tool results", () => {
    const normalized = normalizeToolResult({
      result: {
        params: {
          structuredContent: {
            explanation
          },
          _meta: {
            quote,
            formDefaults: quote.input
          }
        }
      }
    });

    expect(normalized.quote?.serviceName).toBe("Paver Patio");
    expect(normalized.explanation?.steps.length).toBe(2);
    expect(normalized.formDefaults?.region).toBe("london");
  });
});
