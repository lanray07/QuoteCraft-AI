import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test } from "vitest";
import { appConfig } from "../lib/app-config.js";
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

describe("tool annotations", () => {
  test("all advertised tools expose explicit boolean safety annotations", async () => {
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
      }
    } finally {
      await client.close();
      await server.close();
    }
  });
});
