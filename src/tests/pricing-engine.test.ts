import { beforeAll, describe, expect, test } from "vitest";
import { warmPricingData } from "../lib/calculator.js";
import { explainDeterministicQuote, generateDeterministicQuote } from "../lib/pricing-engine.js";

beforeAll(async () => {
  await warmPricingData();
});

describe("pricing engine", () => {
  test("applies extras, region, and urgency adjustments", async () => {
    const quote = await generateDeterministicQuote({
      serviceType: "pressure_washing",
      projectSize: 1200,
      location: "Manchester",
      region: "north_west",
      qualityTier: "standard",
      urgency: "urgent",
      extras: ["degreasing", "mildew_treatment"]
    });

    expect(quote.extrasTotal).toBe(324);
    expect(quote.regionalAdjustment).toBeLessThan(0);
    expect(quote.urgencyAdjustment).toBeGreaterThan(0);
    expect(quote.selectedExtras).toHaveLength(2);
    expect(quote.clientFacingQuoteText).toContain("Final pricing may shift");
  });

  test("builds a readable explanation object", async () => {
    const quote = await generateDeterministicQuote({
      serviceType: "lawn_makeover",
      projectSize: 0.25,
      location: "Guildford",
      region: "south_east",
      qualityTier: "premium",
      urgency: "standard",
      extras: ["mulch_beds"]
    });
    const explanation = explainDeterministicQuote(quote);

    expect(explanation.summary).toContain("deterministic");
    expect(explanation.steps.length).toBe(quote.formulaBreakdown.length);
    expect(explanation.assumptions.length).toBeGreaterThan(2);
  });
});
