# Submission Notes

- Built against the current OpenAI Apps SDK guidance for ChatGPT apps: MCP server plus `text/html;profile=mcp-app` component resource.
- Uses `@modelcontextprotocol/sdk` and `@modelcontextprotocol/ext-apps` with `registerAppTool` and `registerAppResource`.
- Uses standard `_meta.ui.resourceUri` metadata and includes OpenAI compatibility aliases for ChatGPT widget framing.
- Tool outputs return both transcript-visible `structuredContent` and widget-only `_meta` hydration data.
- Pricing is deterministic, auditable, and fully config-driven.
