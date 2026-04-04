import { formatCurrency, formatRegionLabel } from "../lib/display-formatters.js";
import type { QuoteEstimate, QuoteExplanation } from "../lib/types.js";

interface QuoteResultCardProps {
  quote: QuoteEstimate;
  explanation: QuoteExplanation | null;
}

export function QuoteResultCard({ quote, explanation }: QuoteResultCardProps) {
  return (
    <section className="result-card">
      <div className="result-header">
        <div>
          <p className="eyebrow">Client-ready estimate</p>
          <h2>{quote.serviceName}</h2>
          <p className="muted">
            {quote.input.projectSize} {quote.unitLabel.toLowerCase()} in {quote.input.location} ·{" "}
            {formatRegionLabel(quote.input.region)} · {quote.input.qualityTier}
          </p>
        </div>
        <div className="estimate-pill">{formatCurrency(quote.midEstimate)}</div>
      </div>

      <div className="estimate-grid">
        <div>
          <span>Low</span>
          <strong>{formatCurrency(quote.lowEstimate)}</strong>
        </div>
        <div>
          <span>Mid</span>
          <strong>{formatCurrency(quote.midEstimate)}</strong>
        </div>
        <div>
          <span>High</span>
          <strong>{formatCurrency(quote.highEstimate)}</strong>
        </div>
        <div>
          <span>Materials</span>
          <strong>{formatCurrency(quote.materialEstimate)}</strong>
        </div>
        <div>
          <span>Labor</span>
          <strong>{formatCurrency(quote.laborEstimate)}</strong>
        </div>
        <div>
          <span>Markup</span>
          <strong>{formatCurrency(quote.markupAmount)}</strong>
        </div>
        <div>
          <span>Regional adj.</span>
          <strong>{formatCurrency(quote.regionalAdjustment)}</strong>
        </div>
        <div>
          <span>Urgency adj.</span>
          <strong>{formatCurrency(quote.urgencyAdjustment)}</strong>
        </div>
        <div>
          <span>Extras</span>
          <strong>{formatCurrency(quote.extrasTotal)}</strong>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Breakdown</h3>
        </div>
        <div className="line-items">
          {quote.formulaBreakdown.map((line) => (
            <div key={line.key} className="line-item">
              <div>
                <strong>{line.label}</strong>
                <p>{line.detail}</p>
              </div>
              <span>{formatCurrency(line.value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Selected extras</h3>
        </div>
        {quote.selectedExtras.length ? (
          <div className="line-items">
            {quote.selectedExtras.map((extra) => (
              <div key={extra.key} className="line-item">
                <div>
                  <strong>{extra.label}</strong>
                  <p>{extra.key.replaceAll("_", " ")}</p>
                </div>
                <span>{formatCurrency(extra.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No extras selected.</p>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Client-facing quote text</h3>
        </div>
        <p className="client-copy">{quote.clientFacingQuoteText}</p>
      </div>

      {explanation ? (
        <div className="panel">
          <div className="panel-header">
            <h3>How it was calculated</h3>
          </div>
          <p className="muted">{explanation.summary}</p>
          <ul className="bullet-list">
            {explanation.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
