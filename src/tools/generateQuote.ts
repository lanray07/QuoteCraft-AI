import { explainDeterministicQuote, generateDeterministicQuote } from "../lib/pricing-engine.js";
import { parseQuoteInput, type RawQuoteInput } from "../lib/validators.js";

export async function generateQuoteTool(input: RawQuoteInput) {
  const normalized = parseQuoteInput(input);
  const estimate = await generateDeterministicQuote(normalized);

  return {
    structuredContent: {
      status: "quote_ready",
      quote: estimate
    },
    content: [],
    _meta: {
      formDefaults: estimate.input,
      quote: estimate
    }
  };
}
