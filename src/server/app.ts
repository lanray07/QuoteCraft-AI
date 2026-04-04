import cors from "cors";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Express, Request, Response } from "express";
import { appConfig } from "../lib/app-config.js";
import { warmPricingData } from "../lib/calculator.js";
import { quoteOutputStyle } from "../prompts/quote-output-style.js";
import { systemPrompt } from "../prompts/system.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requireJson } from "./middleware/validation.js";
import { registerComponents } from "./register-components.js";
import { registerTools } from "./register-tools.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerMetadataRoute } from "./routes/metadata.js";

function createServer() {
  const server = new McpServer(
    {
      name: appConfig.slug,
      version: appConfig.version
    },
    {
      capabilities: {
        logging: {}
      }
    }
  );

  registerComponents(server);
  registerTools(server);
  server.registerPrompt(
    "quotecraft-guidance",
    {
      title: "QuoteCraft Guidance",
      description: "Guidance prompt for transparent quote generation."
    },
    async () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `${systemPrompt}\n\n${quoteOutputStyle}`
          }
        }
      ]
    })
  );

  return server;
}

export async function createQuoteCraftApp(host = "127.0.0.1"): Promise<Express> {
  await warmPricingData();

  const app = createMcpExpressApp({ host });

  app.use(cors());
  app.use(requireJson);
  registerHealthRoute(app);
  registerMetadataRoute(app);

  app.get("/", (_req: Request, res: Response) => {
    res.json({
      name: appConfig.name,
      description: appConfig.description,
      endpoints: {
        mcp: appConfig.mcpPath,
        metadata: appConfig.metadataPath,
        health: appConfig.healthPath
      }
    });
  });

  app.post(appConfig.mcpPath, async (req: Request, res: Response) => {
    const server = createServer();

    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);

      res.on("close", () => {
        void transport.close();
        void server.close();
      });
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : "Internal server error"
          },
          id: null
        });
      }
    }
  });

  app.get(appConfig.mcpPath, (_req: Request, res: Response) => {
    res.status(405).json({ error: "Use POST for MCP requests." });
  });

  app.use(errorHandler);

  return app;
}
