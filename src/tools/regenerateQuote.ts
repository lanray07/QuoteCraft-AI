import { explainDeterministicQuote, generateDeterministicQuote } from "../lib/pricing-engine.js";
import { parseQuoteInput, type RawQuoteInput } from "../lib/validators.js";

export async function regenerateQuoteTool(input: RawQuoteInput) {
  const normalized = parseQuoteInput(input);
  const estimate = await generateDeterministicQuote(normalized);
  const explanation = explainDeterministicQuote(estimate);

  return {
    structuredContent: {
      quote: estimate
    },
    content: [
      {
        type: "text" as const,
        text: estimate.authoritativeSummaryText
      }
    ],
    _meta: {
      formDefaults: estimate.input,
      explanation
    }
  };
}
