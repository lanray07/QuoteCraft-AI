import { beforeAll, describe, expect, test } from "vitest";
import { warmPricingData } from "../lib/calculator.js";
import { normalizeRegion, parseQuoteInput, validateExtras } from "../lib/validators.js";

beforeAll(async () => {
  await warmPricingData();
});

describe("validators", () => {
  test("normalizes supported region aliases", () => {
    expect(normalizeRegion("South East")).toBe("south_east");
    expect(normalizeRegion("unknown region")).toBe("default");
  });

  test("parses and validates a valid quote input", () => {
    const parsed = parseQuoteInput({
      serviceType: "paver_patio",
      projectSize: 400,
      location: "London",
      region: "South East",
      qualityTier: "standard",
      urgency: "urgent",
      extras: ["demolition_prep"]
    });

    expect(parsed.region).toBe("south_east");
    expect(parsed.extras).toEqual(["demolition_prep"]);
  });

  test("replaces placeholder location and region values with service defaults", () => {
    const parsed = parseQuoteInput({
      serviceType: "paver_patio",
      projectSize: 500,
      location: "Not specified",
      region: "default",
      qualityTier: "standard",
      urgency: "standard",
      extras: []
    });

    expect(parsed.location).toBe("London");
    expect(parsed.region).toBe("london");
  });

  test("rejects unsupported extras", () => {
    expect(() => validateExtras("pressure_washing", ["border_accent"])).toThrow(
      /Unsupported extra/
    );
  });

  test("rejects invalid sizes", () => {
    expect(() =>
      parseQuoteInput({
        serviceType: "pressure_washing",
        projectSize: 0,
        location: "Birmingham",
        region: "midlands",
        qualityTier: "budget",
        urgency: "standard",
        extras: []
      })
    ).toThrow(/greater than zero/);
  });
});
