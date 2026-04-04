import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { appConfig } from "../lib/app-config.js";

const currentDir = dirname(fileURLToPath(import.meta.url));

async function readWidgetBuildAssets() {
  const manifestCandidates = [
    resolve(currentDir, "../../widget/.vite/manifest.json"),
    resolve(currentDir, "../../widget/manifest.json")
  ];

  let manifestPath: string | null = null;

  for (const candidate of manifestCandidates) {
    try {
      await readFile(candidate, "utf8");
      manifestPath = candidate;
      break;
    } catch {
      continue;
    }
  }

  if (!manifestPath) {
    throw new Error("Widget build artifacts were not found. Run `npm run build:widget` first.");
  }

  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<
    string,
    { file: string; css?: string[] }
  >;
  const entry = manifest[appConfig.widgetEntry];

  if (!entry) {
    throw new Error(`Widget manifest does not include ${appConfig.widgetEntry}.`);
  }

  const widgetDir = dirname(manifestPath);
  const rootDir = resolve(widgetDir, "..");
  const script = await readFile(resolve(rootDir, entry.file), "utf8");
  const css = entry.css?.length
    ? (
        await Promise.all(entry.css.map((file) => readFile(resolve(rootDir, file), "utf8")))
      ).join("\n")
    : "";

  return { script, css };
}

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
      const { script, css } = await readWidgetBuildAssets();

      return {
        contents: [
          {
            uri: appConfig.widgetResourceUri,
            mimeType: RESOURCE_MIME_TYPE,
            text: buildWidgetDocument(script, css),
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
