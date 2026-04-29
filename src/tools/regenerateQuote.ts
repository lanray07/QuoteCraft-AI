import { explainDeterministicQuote, generateDeterministicQuote } from "../lib/pricing-engine.js";
import { parseQuoteInput, type RawQuoteInput } from "../lib/validators.js";

export async function regenerateQuoteTool(input: RawQuoteInput) {
  const normalized = parseQuoteInput(input);
  const estimate = await generateDeterministicQuote(normalized);

  return {
    structuredContent: {
      status: "quote_ready",
      quote: estimate
    },
    content: [
      {
        type: "text" as const,
        text: "Updated quote ready in the QuoteCraft AI widget. Use the widget as the authoritative estimate and pricing breakdown."
      }
    ],
    _meta: {
      formDefaults: estimate.input,
      quote: estimate
    }
  };
}
