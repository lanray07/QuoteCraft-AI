import { explainDeterministicQuote, generateDeterministicQuote } from "../lib/pricing-engine.js";
import { parseQuoteInput, type RawQuoteInput } from "../lib/validators.js";

export async function explainQuoteTool(input: RawQuoteInput) {
  const normalized = parseQuoteInput(input);
  const estimate = await generateDeterministicQuote(normalized);
  const explanation = explainDeterministicQuote(estimate);

  return {
    structuredContent: {
      status: "explanation_ready",
      quote: estimate,
      explanation
    },
    content: [],
    _meta: {
      formDefaults: estimate.input,
      quote: estimate,
      explanation
    }
  };
}
