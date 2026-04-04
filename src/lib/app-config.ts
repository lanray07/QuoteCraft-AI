export const appConfig = {
  name: "QuoteCraft AI",
  slug: "quotecraft-ai",
  version: "1.0.0",
  description:
    "Deterministic quote builder for service businesses running as a ChatGPT app.",
  mcpPath: "/mcp",
  healthPath: "/health",
  metadataPath: "/metadata",
  widgetResourceUri: "ui://quotecraft/quote-widget.html",
  widgetEntry: "src/components/app.tsx",
  tools: {
    generateQuote: "generateQuote",
    explainQuote: "explainQuote",
    regenerateQuote: "regenerateQuote"
  }
} as const;

export type AppConfig = typeof appConfig;
