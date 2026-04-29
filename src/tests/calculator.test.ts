import { beforeAll, describe, expect, test } from "vitest";
import { warmPricingData } from "../lib/calculator.js";
import { generateDeterministicQuote } from "../lib/pricing-engine.js";

beforeAll(async () => {
  await warmPricingData();
});

describe("calculator", () => {
  test("calculates a deterministic paver patio quote", async () => {
    const quote = await generateDeterministicQuote({
      serviceType: "paver_patio",
      projectSize: 500,
      location: "London",
      region: "london",
      qualityTier: "standard",
      urgency: "standard",
      extras: []
    });

    expect(quote.materialEstimate).toBe(9000);
    expect(quote.laborEstimate).toBe(7500);
    expect(quote.markupAmount).toBe(2970);
    expect(quote.regionalAdjustment).toBe(3505);
    expect(quote.midEstimate).toBe(22975);
    expect(quote.workingEstimate).toBe(22975);
    expect(quote.lowEstimate).toBe(21137);
    expect(quote.highEstimate).toBe(25732);
    expect(quote.minimumApplied).toBe(false);
    expect(quote.authoritativeSummaryText).toContain("Working estimate: £22,975");
  });

  test("enforces minimum job totals where required", async () => {
    const quote = await generateDeterministicQuote({
      serviceType: "pressure_washing",
      projectSize: 100,
      location: "Leeds",
      region: "default",
      qualityTier: "budget",
      urgency: "standard",
      extras: []
    });

    expect(quote.minimumApplied).toBe(true);
    expect(quote.midEstimate).toBe(413);
    expect(quote.lowEstimate).toBe(388);
    expect(quote.highEstimate).toBe(454);
  });
});
