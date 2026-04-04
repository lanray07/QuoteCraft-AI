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

  test("generateQuote returns quote data and hydration meta", async () => {
    const result = await generateQuoteTool(baseInput);

    expect(result.structuredContent.quote.serviceName).toBe("Paver Patio");
    expect(result._meta.formDefaults.location).toBe("London");
    expect(result._meta.explanation.summary).toContain("deterministic");
  });

  test("explainQuote includes formula explanation alongside the quote", async () => {
    const result = await explainQuoteTool(baseInput);

    expect(result.structuredContent.explanation.steps.length).toBeGreaterThan(0);
    expect(result.content[0].text).toContain("deterministic");
  });

  test("regenerateQuote reflects changed urgency", async () => {
    const result = await regenerateQuoteTool({
      ...baseInput,
      urgency: "urgent"
    });

    expect(result.structuredContent.quote.urgencyAdjustment).toBeGreaterThan(0);
  });
});
