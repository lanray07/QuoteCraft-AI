import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { widgetCss, widgetScript } from "../generated/widget-artifact.js";
import { appConfig } from "../lib/app-config.js";

function buildWidgetDocument(script: string, css: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>QuoteCraft AI</title>
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">${script}</script>
  </body>
</html>`;
}

export function registerComponents(server: McpServer): void {
  registerAppResource(
    server,
    "QuoteCraft Quote Widget",
    appConfig.widgetResourceUri,
    {
      title: "QuoteCraft AI",
      description: "Interactive quote form and result breakdown for service-business estimates."
    },
    async () => {
      if (!widgetScript) {
        throw new Error("Widget build artifacts were not embedded. Run `npm run build` first.");
      }

      return {
        contents: [
          {
            uri: appConfig.widgetResourceUri,
            mimeType: RESOURCE_MIME_TYPE,
            text: buildWidgetDocument(widgetScript, widgetCss),
            _meta: {
              ui: {
                prefersBorder: true,
                domain: process.env.OPENAI_APP_DOMAIN,
                csp: {
                  connectDomains: [],
                  resourceDomains: []
                }
              },
              "openai/widgetDescription":
                "Interactive quote builder showing the form, pricing breakdown, assumptions, and client-ready quote text.",
              "openai/widgetPrefersBorder": true,
              "openai/widgetDomain": process.env.OPENAI_APP_DOMAIN,
              "openai/widgetCSP": {
                connect_domains: [],
                resource_domains: []
              }
            }
          }
        ]
      };
    }
  );
}
