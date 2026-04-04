import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { appConfig } from "../lib/app-config.js";
import { quoteToolInputShape } from "../lib/validators.js";
import { explainQuoteTool } from "../tools/explainQuote.js";
import { generateQuoteTool } from "../tools/generateQuote.js";
import { regenerateQuoteTool } from "../tools/regenerateQuote.js";

const sharedMeta = {
  ui: {
    resourceUri: appConfig.widgetResourceUri,
    visibility: ["model", "app"] as const
  }
};

export function registerTools(server: McpServer): void {
  registerAppTool(
    server,
    appConfig.tools.generateQuote,
    {
      title: "Generate Quote",
      description:
        "Create a transparent, deterministic service-business estimate using configured pricing rules.",
      inputSchema: quoteToolInputShape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true
      },
      _meta: {
        ...sharedMeta,
        "openai/toolInvocation/invoking": "Building quote",
        "openai/toolInvocation/invoked": "Quote ready"
      }
    },
    generateQuoteTool
  );

  registerAppTool(
    server,
    appConfig.tools.explainQuote,
    {
      title: "Explain Quote",
      description: "Explain exactly how a quote was calculated and which assumptions were used.",
      inputSchema: quoteToolInputShape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true
      },
      _meta: {
        ...sharedMeta,
        "openai/toolInvocation/invoking": "Explaining quote",
        "openai/toolInvocation/invoked": "Explanation ready"
      }
    },
    explainQuoteTool
  );

  registerAppTool(
    server,
    appConfig.tools.regenerateQuote,
    {
      title: "Regenerate Quote",
      description:
        "Recalculate a quote after changing tier, region, urgency, size, or selected extras.",
      inputSchema: quoteToolInputShape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true
      },
      _meta: {
        ...sharedMeta,
        "openai/toolInvocation/invoking": "Refreshing quote",
        "openai/toolInvocation/invoked": "Updated quote ready"
      }
    },
    regenerateQuoteTool
  );
}
