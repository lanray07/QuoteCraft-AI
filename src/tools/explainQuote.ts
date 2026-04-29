import { explainDeterministicQuote, generateDeterministicQuote } from "../lib/pricing-engine.js";
import { parseQuoteInput, type RawQuoteInput } from "../lib/validators.js";

export async function explainQuoteTool(input: RawQuoteInput) {
  const normalized = parseQuoteInput(input);
  const estimate = await generateDeterministicQuote(normalized);
  const explanation = explainDeterministicQuote(estimate);

  return {
    structuredContent: {
      status: "explanation_ready"
    },
    content: [
      {
        type: "text" as const,
        text: "Pricing explanation loaded in the QuoteCraft AI widget. Use the widget as the authoritative estimate, assumptions, and calculation breakdown."
      }
    ],
    _meta: {
      formDefaults: estimate.input,
      quote: estimate,
      explanation
    }
  };
}
