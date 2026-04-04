import { explainDeterministicQuote, generateDeterministicQuote } from "../lib/pricing-engine.js";
import { parseQuoteInput, type RawQuoteInput } from "../lib/validators.js";

export async function generateQuoteTool(input: RawQuoteInput) {
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
        text: `${estimate.serviceName} estimate ready: ${estimate.lowEstimate} to ${estimate.highEstimate} GBP, with a working estimate of ${estimate.midEstimate} GBP.`
      }
    ],
    _meta: {
      formDefaults: estimate.input,
      explanation
    }
  };
}
