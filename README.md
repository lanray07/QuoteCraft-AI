# QuoteCraft AI

QuoteCraft AI is a production-oriented ChatGPT app for building fast, professional service-business quotes inside ChatGPT. The MVP supports paver patios, lawn makeovers, and pressure washing with deterministic pricing logic driven by JSON config instead of opaque model-invented pricing.

## What It Does

- Collects quote inputs in an in-chat interactive UI
- Calculates low, mid, and high estimates with transparent formulas
- Breaks out materials, labor, markup, regional adjustment, urgency adjustment, and extras
- Generates assumptions, upsell suggestions, and client-ready quote copy
- Lets users recalculate or explain a quote inside the same ChatGPT app experience

## Architecture

- `src/server/*`: Express-hosted MCP server using `@modelcontextprotocol/sdk`
- `src/server/register-tools.ts`: ChatGPT app tool registration with `registerAppTool`
- `src/server/register-components.ts`: HTML widget resource registration with `registerAppResource`
- `src/components/*`: React widget rendered inside ChatGPT
- `src/lib/*`: Pricing engine, formatting, validation, and shared types
- `src/data/*`: JSON pricing rules, markup settings, regional multipliers, and service templates
- `src/tools/*`: Thin tool handlers that normalize inputs, generate quotes, and return structured results
- `src/tests/*`: Vitest coverage for calculations, validators, and tool flows

## Current Apps SDK Alignment

This repo follows the current OpenAI Apps SDK approach for ChatGPT apps:

- MCP server over Streamable HTTP
- app resources served as `text/html;profile=mcp-app`
- tool-to-widget linkage via `_meta.ui.resourceUri`
- OpenAI compatibility metadata included where useful for ChatGPT widget framing
- tool responses returning `structuredContent`, transcript text, and widget-only `_meta`

If OpenAI Apps SDK conventions evolve, adapt the runtime wiring first in:

- `src/server/register-tools.ts`
- `src/server/register-components.ts`
- `src/server/index.ts`

## File Structure

```text
quotecraft-ai/
├─ README.md
├─ package.json
├─ tsconfig.json
├─ .env.example
├─ .gitignore
├─ vercel.json
├─ appsdk.config.ts
├─ src/
│  ├─ server/
│  ├─ components/
│  ├─ tools/
│  ├─ lib/
│  ├─ data/
│  ├─ prompts/
│  └─ tests/
└─ docs/
```

## Pricing Logic Summary

Each quote follows the same deterministic pipeline:

1. Select service pricing rates by `serviceType` and `qualityTier`
2. Multiply material and labor unit rates by project size
3. Add selected extra costs from config
4. Enforce the service minimum when subtotal is too low
5. Apply default markup
6. Apply regional multiplier
7. Apply urgency multiplier
8. Derive low and high range from service-specific range multipliers

No part of the quote total depends on hidden AI-estimated pricing.

## Local Development

### Requirements

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

- `PORT`: local server port
- `APP_BASE_URL`: public base URL for your deployment
- `OPENAI_APP_DOMAIN`: dedicated widget origin if you have one for submission

### Run Locally

Build the widget and start the server:

```bash
npm run build:widget
npm run dev
```

For a rebuild-on-change widget loop in a second terminal:

```bash
npm run dev:widget
```

### Health and Metadata

- Health: `GET /health`
- Metadata: `GET /metadata`
- MCP endpoint: `POST /mcp`

## Testing

Run the test suite:

```bash
npm test
```

Run a production build:

```bash
npm run build
```

## Connecting in ChatGPT Developer Workflow

1. Start or deploy the app so the MCP endpoint is reachable.
2. Point ChatGPT developer mode or connector setup to your `POST /mcp` endpoint.
3. Verify the widget resource resolves and that tool calls `generateQuote`, `explainQuote`, and `regenerateQuote` are discoverable.
4. Test prompts such as:
   - `Quote a 500 sq ft paver patio`
   - `Estimate a lawn makeover for 1/4 acre`
   - `Create a pressure washing quote for driveway + patio`

## Deploying to Vercel

1. Import the repo into Vercel
2. Set environment variables from `.env.example`
3. Confirm `npm run build` succeeds in Vercel build logs
4. Expose the deployment URL as your ChatGPT app endpoint
5. If required for submission, set a dedicated `OPENAI_APP_DOMAIN`

## Updating Pricing Rules

Primary pricing edits live in:

- `src/data/pricing-rules.json`
- `src/data/regional-multipliers.json`
- `src/data/markup-config.json`
- `src/data/service-templates.json`

To add a new service:

1. Add its config in `pricing-rules.json`
2. Add copy in `service-templates.json`
3. Extend `SERVICE_TYPES` in `src/lib/types.ts`
4. Add presets or UI affordances if needed
5. Add tests for the new service

## Extension Ideas

- Add saved quote history and customer records
- Add tax, discount, and deposit rules
- Add photo upload or site-condition modifiers
- Add CRM export or PDF generation
- Add authenticated multi-user pricing profiles
