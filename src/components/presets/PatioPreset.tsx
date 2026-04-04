import type { QuoteInput } from "../../lib/types.js";

interface PatioPresetProps {
  onSelect: (input: QuoteInput) => void;
}

export function PatioPreset({ onSelect }: PatioPresetProps) {
  return (
    <button
      type="button"
      className="preset-card"
      onClick={() =>
        onSelect({
          serviceType: "paver_patio",
          projectSize: 500,
          location: "London",
          region: "london",
          qualityTier: "standard",
          urgency: "standard",
          extras: ["border_accent"]
        })
      }
    >
      <span className="preset-label">Preset</span>
      <strong>500 sq ft paver patio</strong>
      <p>Standard tier with an accent border.</p>
    </button>
  );
}
