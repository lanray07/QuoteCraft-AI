import { explainDeterministicQuote, generateDeterministicQuote } from "../lib/pricing-engine.js";
import { parseQuoteInput, type RawQuoteInput } from "../lib/validators.js";

export async function explainQuoteTool(input: RawQuoteInput) {
  const normalized = parseQuoteInput(input);
  const estimate = await generateDeterministicQuote(normalized);
  const explanation = explainDeterministicQuote(estimate);

  return {
    structuredContent: {
      explanation,
      quote: estimate
    },
    content: [
      {
        type: "text" as const,
        text: `${estimate.authoritativeSummaryText}\n\n${explanation.summary}`
      }
    ],
    _meta: {
      formDefaults: estimate.input,
      explanation
    }
  };
}
