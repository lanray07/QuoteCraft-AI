import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeAll, describe, expect, test } from "vitest";
import { appConfig } from "../lib/app-config.js";
import { warmPricingData } from "../lib/calculator.js";
import { deterministicQuoteToolAnnotations, registerTools } from "../server/register-tools.js";

const expectedToolNames = [
  ...Object.values(appConfig.tools),
  ...Object.values(appConfig.widgetTools)
].sort();

const booleanAnnotationKeys = [
  "readOnlyHint",
  "destructiveHint",
  "openWorldHint",
  "idempotentHint"
] as const;

const baseInput = {
  serviceType: "paver_patio",
  projectSize: 500,
  location: "London",
  region: "london",
  qualityTier: "standard",
  urgency: "standard",
  extras: ["border_accent"]
};

async function connectRegisteredToolClient() {
    const server = new McpServer({
      name: appConfig.slug,
      version: appConfig.version
    });
    const client = new Client({
      name: "quotecraft-annotation-test",
      version: "1.0.0"
    });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    registerTools(server);
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return { client, server };
}

beforeAll(async () => {
  await warmPricingData();
});

describe("tool descriptors", () => {
  test("all advertised tools expose explicit boolean safety annotations and output schemas", async () => {
    const { client, server } = await connectRegisteredToolClient();

    try {
      const { tools } = await client.listTools();

      expect(tools.map((tool) => tool.name).sort()).toEqual(expectedToolNames);

      for (const tool of tools) {
        const annotations = tool.annotations;

        expect(annotations).toBeDefined();
        if (!annotations) {
          throw new Error(`Tool ${tool.name} does not advertise annotations.`);
        }

        for (const key of booleanAnnotationKeys) {
          expect(typeof annotations[key]).toBe("boolean");
        }

        expect(annotations).toMatchObject(deterministicQuoteToolAnnotations);
        expect(tool.outputSchema).toBeDefined();
      }
    } finally {
      await client.close();
      await server.close();
    }
  });

  test("tool outputs validate against their advertised output schemas", async () => {
    const { client, server } = await connectRegisteredToolClient();

    try {
      await client.listTools();

      for (const toolName of Object.values(appConfig.tools)) {
        const result = await client.callTool({
          name: toolName,
          arguments: baseInput
        });

        expect(result.isError).not.toBe(true);
        expect(result.structuredContent).toBeDefined();
      }
    } finally {
      await client.close();
      await server.close();
    }
  });
});
