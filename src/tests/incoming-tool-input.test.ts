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
