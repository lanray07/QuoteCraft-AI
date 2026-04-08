import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AssumptionsList } from "../src/components/AssumptionsList.js";
import { QuoteForm } from "../src/components/QuoteForm.js";
import { QuoteResultCard } from "../src/components/QuoteResultCard.js";
import { UpsellSuggestions } from "../src/components/UpsellSuggestions.js";
import { warmPricingData } from "../src/lib/calculator.js";
import { explainDeterministicQuote, generateDeterministicQuote } from "../src/lib/pricing-engine.js";
import type { QuoteEstimate, QuoteExplanation, QuoteInput } from "../src/lib/types.js";

const root = process.cwd();
const outputDir = path.join(root, "tmp", "submission-screenshots");

interface ScreenshotState {
  fileName: string;
  content: React.ReactElement;
}

function ScreenshotFrame({
  children,
  bodyClassName
}: {
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return <div className={`submission-shell ${bodyClassName ?? ""}`.trim()}>{children}</div>;
}

function FormOnlyState({ input }: { input: QuoteInput }) {
  return (
    <ScreenshotFrame bodyClassName="form-shot">
      <QuoteForm
        value={input}
        onChange={() => undefined}
        onSubmit={() => undefined}
        onExplain={() => undefined}
        isBusy={false}
        hasResult={false}
        result={null}
        explanation={null}
      />
    </ScreenshotFrame>
  );
}

function ResultOnlyState({
  quote,
  explanation,
  bodyClassName
}: {
  quote: QuoteEstimate;
  explanation: QuoteExplanation;
  bodyClassName?: string;
}) {
  return (
    <ScreenshotFrame bodyClassName={bodyClassName}>
      <QuoteResultCard quote={quote} explanation={explanation} />
    </ScreenshotFrame>
  );
}

function BreakdownState({ quote }: { quote: QuoteEstimate }) {
  return (
    <ScreenshotFrame bodyClassName="breakdown-shot">
      <div className="breakdown-grid">
        <AssumptionsList assumptions={quote.assumptions} />
        <UpsellSuggestions items={quote.suggestedUpsells} />
      </div>
    </ScreenshotFrame>
  );
}

async function renderPage(state: ScreenshotState, css: string) {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QuoteCraft AI widget</title>
    <style>
${css}

body {
  min-width: 706px;
}

.submission-shell {
  width: 706px;
  min-height: 760px;
  margin: 0 auto;
  padding: 22px;
  display: grid;
  gap: 18px;
}

.form-shot .form-card {
  margin-top: 0;
  transform: scale(0.84);
  transform-origin: top left;
  width: calc(100% / 0.84);
}

.result-shot .result-card,
.recalc-shot .result-card {
  margin-top: 0;
  transform: scale(0.8);
  transform-origin: top left;
  width: calc(100% / 0.8);
}

.breakdown-grid {
  display: grid;
  gap: 14px;
}

.breakdown-shot .panel {
  margin-top: 0;
}

.result-shot .line-items,
.recalc-shot .line-items {
  gap: 8px;
}

.result-shot .line-item,
.recalc-shot .line-item {
  padding-top: 8px;
}
    </style>
  </head>
  <body>
    <div id="root">${renderToStaticMarkup(state.content)}</div>
  </body>
</html>`;

  await writeFile(path.join(outputDir, `${state.fileName}.html`), html, "utf8");
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await warmPricingData();

  const css = await readFile(path.join(root, "src", "components", "styles.css"), "utf8");

  const formInput: QuoteInput = {
    serviceType: "paver_patio",
    projectSize: 500,
    location: "London",
    region: "london",
    qualityTier: "standard",
    urgency: "standard",
    extras: ["demolition_prep", "polymeric_sand_upgrade"]
  };

  const standardQuote = await generateDeterministicQuote(formInput);
  const standardExplanation = explainDeterministicQuote(standardQuote);

  const premiumInput: QuoteInput = {
    ...formInput,
    qualityTier: "premium",
    urgency: "urgent",
    extras: ["demolition_prep", "polymeric_sand_upgrade", "border_accent"]
  };

  const premiumQuote = await generateDeterministicQuote(premiumInput);
  const premiumExplanation = explainDeterministicQuote(premiumQuote);

  const states: ScreenshotState[] = [
    {
      fileName: "01-quote-form",
      content: <FormOnlyState input={formInput} />
    },
    {
      fileName: "02-quote-result",
      content: (
        <ResultOnlyState
          quote={standardQuote}
          explanation={standardExplanation}
          bodyClassName="result-shot"
        />
      )
    },
    {
      fileName: "03-recalculated-result",
      content: (
        <ResultOnlyState
          quote={premiumQuote}
          explanation={premiumExplanation}
          bodyClassName="recalc-shot"
        />
      )
    },
    {
      fileName: "04-assumptions-upsells",
      content: <BreakdownState quote={premiumQuote} />
    }
  ];

  for (const state of states) {
    await renderPage(state, css);
  }
}

void main();
