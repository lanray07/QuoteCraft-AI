import { useEffect, useState } from "react";
import { widgetPricingRules, widgetRegions } from "./widget-config.js";
import type { QuoteInput, QuoteEstimate } from "../lib/types.js";

interface QuoteFormProps {
  value: QuoteInput;
  onChange: (value: QuoteInput) => void;
  onSubmit: () => void;
  isBusy: boolean;
  hasResult: boolean;
  result: QuoteEstimate | null;
}

function formatProjectSizeInput(value: number): string {
  return Number.isFinite(value) && value > 0 ? String(value) : "";
}

function parseProjectSizeInput(value: string): number | null {
  const normalized = value.replaceAll(",", "").trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeProjectSizeDraft(value: string): string {
  const normalized = value.replaceAll(",", "").trim();
  if (!normalized || normalized === "0" || normalized.startsWith("0.")) {
    return normalized;
  }

  return normalized.replace(/^0+(?=\d)/, "");
}

export function QuoteForm({
  value,
  onChange,
  onSubmit,
  isBusy,
  hasResult,
  result
}: QuoteFormProps) {
  const service = widgetPricingRules.services[value.serviceType];
  const availableExtras = Object.entries(service.optionalExtras);
  const [projectSizeDraft, setProjectSizeDraft] = useState(
    formatProjectSizeInput(value.projectSize)
  );
  const hasValidProjectSize = Number.isFinite(value.projectSize) && value.projectSize > 0;

  useEffect(() => {
    setProjectSizeDraft(formatProjectSizeInput(value.projectSize));
  }, [value.projectSize]);

  const update = <K extends keyof QuoteInput>(key: K, nextValue: QuoteInput[K]) => {
    if (key === "serviceType") {
      const nextService = widgetPricingRules.services[nextValue as QuoteInput["serviceType"]];
      onChange({
        ...value,
        [key]: nextValue,
        extras: [],
        projectSize: 0,
        region: value.region,
        location: value.location || "London"
      });
      if (!nextService) {
        return;
      }
      return;
    }

    onChange({
      ...value,
      [key]: nextValue
    });
  };

  const updateProjectSize = (rawValue: string) => {
    const nextDraft = normalizeProjectSizeDraft(rawValue);
    setProjectSizeDraft(nextDraft);
    const parsed = parseProjectSizeInput(nextDraft);
    if (parsed === null) {
      return;
    }

    update("projectSize", parsed);
  };

  const toggleExtra = (extraKey: string) => {
    onChange({
      ...value,
      extras: value.extras.includes(extraKey)
        ? value.extras.filter((item) => item !== extraKey)
        : [...value.extras, extraKey]
    });
  };

  return (
    <section className="form-card">
      <div className="form-card-header">
        <div>
          <p className="eyebrow">Quote builder</p>
          <h1>QuoteCraft AI</h1>
          <p className="muted">
            Build a polished, transparent quote in under a minute.
          </p>
        </div>
        <div className="status-chip">{isBusy ? "Working..." : hasResult ? "Ready" : "Draft"}</div>
      </div>

      <div className="form-grid">
        <label>
          <span>Service type</span>
          <select
            value={value.serviceType}
            onChange={(event) => update("serviceType", event.target.value as QuoteInput["serviceType"])}
          >
            {Object.entries(widgetPricingRules.services).map(([key, item]) => (
              <option key={key} value={key}>
                {item.displayName}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>{service.sizeLabel}</span>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]*"
            value={projectSizeDraft}
            placeholder={value.serviceType === "lawn_makeover" ? "0.25" : "1000"}
            aria-invalid={!hasValidProjectSize}
            onFocus={(event) => event.currentTarget.select()}
            onBlur={() => setProjectSizeDraft(formatProjectSizeInput(value.projectSize))}
            onChange={(event) => updateProjectSize(event.target.value)}
          />
        </label>

        <label>
          <span>Location / region</span>
          <input
            value={value.location}
            onChange={(event) => update("location", event.target.value)}
            placeholder="City or area"
          />
        </label>

        <label>
          <span>Regional pricing</span>
          <select
            value={value.region}
            onChange={(event) => update("region", event.target.value as QuoteInput["region"])}
          >
            {Object.entries(widgetRegions).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Quality tier</span>
          <select
            value={value.qualityTier}
            onChange={(event) =>
              update("qualityTier", event.target.value as QuoteInput["qualityTier"])
            }
          >
            <option value="budget">Budget</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </label>

        <label>
          <span>Urgency</span>
          <select
            value={value.urgency}
            onChange={(event) => update("urgency", event.target.value as QuoteInput["urgency"])}
          >
            <option value="standard">Standard</option>
            <option value="urgent">Urgent</option>
            <option value="weekend">Weekend</option>
          </select>
        </label>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Optional extras</h3>
          <p>{availableExtras.length} available for this service</p>
        </div>
        <div className="extras-grid">
          {availableExtras.map(([key, extra]) => (
            <label key={key} className={`extra-chip ${value.extras.includes(key) ? "selected" : ""}`}>
              <input
                type="checkbox"
                checked={value.extras.includes(key)}
                onChange={() => toggleExtra(key)}
              />
              <span>{extra.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="action-row">
        <button
          type="button"
          className="primary-button"
          onClick={onSubmit}
          disabled={isBusy || !hasValidProjectSize}
        >
          {result ? "Recalculate quote" : "Generate quote"}
        </button>
        <span className="inline-note">Transparent assumptions and pricing logic are shown below the estimate.</span>
      </div>
    </section>
  );
}
