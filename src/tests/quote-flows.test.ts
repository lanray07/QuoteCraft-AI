import { beforeAll, describe, expect, test } from "vitest";
import { warmPricingData } from "../lib/calculator.js";
import { explainQuoteTool } from "../tools/explainQuote.js";
import { generateQuoteTool } from "../tools/generateQuote.js";
import { regenerateQuoteTool } from "../tools/regenerateQuote.js";

beforeAll(async () => {
  await warmPricingData();
});

describe("quote tool flows", () => {
  const baseInput = {
    serviceType: "paver_patio" as const,
    projectSize: 500,
    location: "London",
    region: "london",
    qualityTier: "standard" as const,
    urgency: "standard" as const,
    extras: ["border_accent"]
  };

  test("generateQuote returns widget hydration data in metadata", async () => {
    const result = await generateQuoteTool(baseInput);

    expect(result.structuredContent.status).toBe("quote_ready");
    expect(result.structuredContent.quote.serviceName).toBe("Paver Patio");
    expect(result._meta.quote.serviceName).toBe("Paver Patio");
    expect(result._meta.quote.workingEstimate).toBe(result._meta.quote.midEstimate);
    expect(result._meta.formDefaults.location).toBe("London");
    expect((result._meta as { explanation?: unknown }).explanation).toBeUndefined();
    expect(result.content).toEqual([]);
  });

  test("explainQuote returns the explanation through metadata", async () => {
    const result = await explainQuoteTool(baseInput);

    expect(result.structuredContent.status).toBe("explanation_ready");
    expect(result.structuredContent.quote.serviceName).toBe("Paver Patio");
    expect(result.structuredContent.explanation.steps.length).toBeGreaterThan(0);
    expect(result._meta.quote.serviceName).toBe("Paver Patio");
    expect(result._meta.explanation.steps.length).toBeGreaterThan(0);
    expect(result.content).toEqual([]);
  });

  test("regenerateQuote reflects changed urgency in metadata", async () => {
    const result = await regenerateQuoteTool({
      ...baseInput,
      urgency: "urgent"
    });

    expect(result.structuredContent.status).toBe("quote_ready");
    expect(result.structuredContent.quote.urgencyAdjustment).toBeGreaterThan(0);
    expect(result._meta.quote.urgencyAdjustment).toBeGreaterThan(0);
    expect((result._meta as { explanation?: unknown }).explanation).toBeUndefined();
    expect(result.content).toEqual([]);
  });
});
