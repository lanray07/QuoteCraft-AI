import { describe, expect, test } from "vitest";
import { getDefaultQuoteInput } from "../lib/default-inputs.js";
import { coerceIncomingQuoteInput } from "../components/incoming-tool-input.js";

describe("incoming tool input coercion", () => {
  test("hydrates a larger project size from tool arguments", () => {
    const fallback = getDefaultQuoteInput("paver_patio");

    const nextInput = coerceIncomingQuoteInput(
      {
        arguments: {
          serviceType: "paver_patio",
          projectSize: 1000
        }
      },
      fallback
    );

    expect(nextInput).not.toBeNull();
    expect(nextInput?.projectSize).toBe(1000);
    expect(nextInput?.region).toBe("london");
    expect(nextInput?.location).toBe("London");
  });

  test("hydrates nested ChatGPT tool input instead of keeping preset defaults", () => {
    const fallback = getDefaultQuoteInput("paver_patio");

    const nextInput = coerceIncomingQuoteInput(
      {
        params: {
          arguments: {
            service: "paver patio",
            size: "1000 sq ft",
            location: "London",
            region: "london"
          }
        }
      },
      fallback
    );

    expect(nextInput).not.toBeNull();
    expect(nextInput?.serviceType).toBe("paver_patio");
    expect(nextInput?.projectSize).toBe(1000);
    expect(nextInput?.location).toBe("London");
    expect(nextInput?.region).toBe("london");
  });

  test("hydrates JSON-string tool arguments", () => {
    const fallback = getDefaultQuoteInput("paver_patio");

    const nextInput = coerceIncomingQuoteInput(
      {
        arguments: JSON.stringify({
          serviceType: "paver_patio",
          squareFeet: "1,000"
        })
      },
      fallback
    );

    expect(nextInput).not.toBeNull();
    expect(nextInput?.projectSize).toBe(1000);
  });

  test("ignores empty wrapper payloads without applying the preset size", () => {
    const fallback = getDefaultQuoteInput("paver_patio");

    const nextInput = coerceIncomingQuoteInput(
      {
        params: {
          id: "not-quote-input"
        }
      },
      fallback
    );

    expect(nextInput).toBeNull();
  });

  test("ignores service-only payloads without applying the preset size", () => {
    const fallback = getDefaultQuoteInput("paver_patio");

    const nextInput = coerceIncomingQuoteInput(
      {
        arguments: {
          service: "paver patio"
        }
      },
      fallback
    );

    expect(nextInput).toBeNull();
  });

  test("switching service types falls back to that service defaults", () => {
    const fallback = getDefaultQuoteInput("paver_patio");

    const nextInput = coerceIncomingQuoteInput(
      {
        arguments: {
          serviceType: "pressure_washing",
          projectSize: 900
        }
      },
      fallback
    );

    expect(nextInput).not.toBeNull();
    expect(nextInput?.serviceType).toBe("pressure_washing");
    expect(nextInput?.projectSize).toBe(900);
    expect(nextInput?.location).toBe("Manchester");
    expect(nextInput?.region).toBe("north_west");
  });
});
