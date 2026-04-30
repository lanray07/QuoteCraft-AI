import { App, PostMessageTransport, applyHostFonts, applyHostStyleVariables } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { appConfig } from "../lib/app-config.js";
import type { QuoteEstimate, QuoteExplanation, QuoteInput } from "../lib/types.js";
import { coerceIncomingQuoteInput } from "./incoming-tool-input.js";
import { normalizeToolResult } from "./result-normalizer.js";
import { QuoteForm } from "./QuoteForm.js";
import { QuoteResultCard } from "./QuoteResultCard.js";
import { LawnPreset } from "./presets/LawnPreset.js";
import { PatioPreset } from "./presets/PatioPreset.js";
import { PressureWashingPreset } from "./presets/PressureWashingPreset.js";
import { getDefaultInput } from "./widget-config.js";
import { explainLocalQuote, generateLocalQuote } from "./local-quote-engine.js";
import "./styles.css";

declare global {
  interface Window {
    openai?: unknown;
  }
}

function AppShell() {
  const [form, setForm] = useState<QuoteInput>(getDefaultInput());
  const [quote, setQuote] = useState<QuoteEstimate | null>(null);
  const [explanation, setExplanation] = useState<QuoteExplanation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [app, setApp] = useState<App | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const formRef = useRef(form);

  function syncForm(nextForm: QuoteInput) {
    formRef.current = nextForm;
    setForm(nextForm);
  }

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    const createdApp = new App(
      { name: appConfig.name, version: appConfig.version },
      {}
    );

    const applyToolResult = (result: CallToolResult) => {
      const normalized = normalizeToolResult(result as CallToolResult & Record<string, unknown>);
      const resultForm = normalized.quote?.input ?? normalized.formDefaults;

      if (resultForm) {
        syncForm(resultForm);
      }

      if (normalized.quote) {
        setQuote(normalized.quote);
      }

      if (normalized.explanation) {
        setExplanation(normalized.explanation);
      } else if (normalized.quote) {
        setExplanation(null);
      }

      setBusy(false);
    };

    const applyToolInput = (payload: unknown, shouldGenerateQuote: boolean) => {
      const nextForm = coerceIncomingQuoteInput(payload, formRef.current);
      if (!nextForm) {
        return;
      }

      syncForm(nextForm);
      setError(null);

      if (!shouldGenerateQuote) {
        return;
      }

      try {
        const nextQuote = generateLocalQuote(nextForm);
        setQuote(nextQuote);
        setExplanation(explainLocalQuote(nextQuote));
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to complete the request.");
      } finally {
        setBusy(false);
      }
    };

    createdApp.ontoolinputpartial = (payload) => {
      applyToolInput(payload, false);
    };
    createdApp.ontoolinput = (payload) => {
      applyToolInput(payload, true);
    };
    createdApp.ontoolresult = applyToolResult;
    createdApp.onhostcontextchanged = (context) => {
      if (context.styles?.variables) {
        applyHostStyleVariables(context.styles.variables);
      }
      if (context.styles?.css?.fonts) {
        applyHostFonts(context.styles.css.fonts);
      }
    };

    void createdApp
      .connect(new PostMessageTransport(window.parent, window.parent))
      .then(() => {
        setApp(createdApp);
        setIsConnected(true);
        setConnectionError(null);
        const initialContext = createdApp.getHostContext();
        if (initialContext?.styles?.variables) {
          applyHostStyleVariables(initialContext.styles.variables);
        }
        if (initialContext?.styles?.css?.fonts) {
          applyHostFonts(initialContext.styles.css.fonts);
        }
      })
      .catch((nextError) => {
        setConnectionError(nextError instanceof Error ? nextError.message : "Unable to connect.");
      });

    return () => {
      void (createdApp as unknown as { close?: () => Promise<void> }).close?.();
    };
  }, []);

  const statusText = useMemo(() => {
    if (connectionError) {
      return connectionError;
    }

    if (!isConnected) {
      return "Connecting to ChatGPT...";
    }

    return "Connected";
  }, [connectionError, isConnected]);

  async function runTool(toolName: string) {
    const isWidgetTool = Object.values(appConfig.widgetTools).includes(
      toolName as (typeof appConfig.widgetTools)[keyof typeof appConfig.widgetTools]
    );

    if (isWidgetTool) {
      try {
        setBusy(true);
        setError(null);
        const nextQuote = generateLocalQuote(formRef.current);
        syncForm(nextQuote.input);
        setQuote(nextQuote);
        setExplanation(explainLocalQuote(nextQuote));
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to complete the request.");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!app) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      const result = await app.callServerTool({
        name: toolName,
        arguments: formRef.current as unknown as Record<string, unknown>
      });
      const normalized = normalizeToolResult(result as CallToolResult & Record<string, unknown>);
      const resultForm = normalized.quote?.input ?? normalized.formDefaults;

      if (normalized.quote) {
        setQuote(normalized.quote);
      }

      if (normalized.explanation) {
        setExplanation(normalized.explanation);
      } else if (normalized.quote) {
        setExplanation(null);
      }

      if (resultForm) {
        syncForm(resultForm);
      }

      if (!normalized.quote && toolName !== appConfig.tools.explainQuote) {
        setError("QuoteCraft AI did not receive quote data back from ChatGPT. Please try again in a fresh chat.");
      } else if (!normalized.explanation && toolName === appConfig.tools.explainQuote) {
        setError("QuoteCraft AI did not receive explanation data back from ChatGPT. Please try again in a fresh chat.");
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to complete the request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Service quote workspace</p>
          <h1>Fast, auditable quotes inside ChatGPT</h1>
          <p className="hero-copy">
            Pick a service, enter size and location, and QuoteCraft AI will calculate a
            structured estimate with transparent formulas.
          </p>
        </div>
        <div className="connection-badge">{statusText}</div>
      </div>

      <div className="preset-strip">
        <PatioPreset onSelect={syncForm} />
        <LawnPreset onSelect={syncForm} />
        <PressureWashingPreset onSelect={syncForm} />
      </div>

      <QuoteForm
        value={form}
        onChange={syncForm}
        onSubmit={() =>
          runTool(
            quote ? appConfig.widgetTools.regenerateQuote : appConfig.widgetTools.generateQuote
          )
        }
        isBusy={busy}
        hasResult={Boolean(quote)}
        result={quote}
      />

      {error ? <div className="error-banner">{error}</div> : null}

      {quote ? (
        <div className="results-stack">
          <QuoteResultCard quote={quote} explanation={explanation} />
        </div>
      ) : (
        <div className="empty-panel">
          <h2>No quote yet</h2>
          <p>Select a preset or enter project details to generate the first estimate.</p>
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppShell />
  </StrictMode>
);
