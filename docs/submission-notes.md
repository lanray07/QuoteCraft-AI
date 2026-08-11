# Submission Notes

- Built against the current OpenAI Apps SDK guidance for ChatGPT apps: MCP server plus `text/html;profile=mcp-app` component resource.
- Uses `@modelcontextprotocol/sdk` and `@modelcontextprotocol/ext-apps` with `registerAppTool` and `registerAppResource`.
- Uses standard `_meta.ui.resourceUri` metadata and includes OpenAI compatibility aliases for ChatGPT widget framing.
- Tool outputs return both transcript-visible `structuredContent` and widget-only `_meta` hydration data.
- Pricing is deterministic, auditable, and fully config-driven.

## Tool annotation review notes

All six MCP tools define explicit boolean annotations in `src/server/register-tools.ts`; none of the required hints are omitted or set to `null`.

| Tool | readOnlyHint | destructiveHint | openWorldHint | idempotentHint | Justification |
| --- | --- | --- | --- | --- | --- |
| `generateQuote` | `true` | `false` | `false` | `true` | Computes a deterministic estimate from submitted inputs and local pricing configuration. It does not create, update, delete, send, enqueue, persist, publish, or call external systems. Repeating the same input returns the same quote data without changing state. |
| `generateQuoteWidget` | `true` | `false` | `false` | `true` | App-only equivalent of `generateQuote`; it only returns calculated quote data for widget hydration and has no side effects outside the current response. |
| `explainQuote` | `true` | `false` | `false` | `true` | Recomputes the deterministic quote and returns an explanation of formula steps and assumptions. It does not modify saved data, overwrite anything, publish content, or contact third-party systems. |
| `explainQuoteWidget` | `true` | `false` | `false` | `true` | App-only equivalent of `explainQuote`; it only returns explanation data for the widget and has no irreversible or external side effects. |
| `regenerateQuote` | `true` | `false` | `false` | `true` | Recalculates quote output after input changes. Despite the name, it does not mutate existing records or persist a quote; it only returns a fresh deterministic calculation. |
| `regenerateQuoteWidget` | `true` | `false` | `false` | `true` | App-only equivalent of `regenerateQuote`; it only recalculates local quote output for widget hydration and can be retried safely. |

The runtime descriptor contract is covered by `src/tests/tool-annotations.test.ts`, which connects to the MCP server in memory, calls `tools/list`, and verifies each advertised tool returns explicit boolean values for `readOnlyHint`, `destructiveHint`, `openWorldHint`, and `idempotentHint`.
