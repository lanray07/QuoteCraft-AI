export const appConfig = {
  name: "QuoteCraft AI",
  slug: "quotecraft-ai",
  version: "1.0.3",
  description:
    "Deterministic quote builder for service businesses running as a ChatGPT app.",
  mcpPath: "/mcp",
  healthPath: "/health",
  metadataPath: "/metadata",
  widgetResourceUri: "ui://quotecraft/quote-widget-v103.html",
  legacyWidgetResourceUris: [
    "ui://quotecraft/quote-widget-v102.html",
    "ui://quotecraft/quote-widget-v101.html",
    "ui://quotecraft/quote-widget.html"
  ],
  widgetEntry: "src/components/app.tsx",
  tools: {
    generateQuote: "generateQuote",
    explainQuote: "explainQuote",
    regenerateQuote: "regenerateQuote"
  },
  widgetTools: {
    generateQuote: "generateQuoteWidget",
    explainQuote: "explainQuoteWidget",
    regenerateQuote: "regenerateQuoteWidget"
  }
} as const;

export type AppConfig = typeof appConfig;
