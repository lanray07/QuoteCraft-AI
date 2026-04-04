import type { QuoteInput } from "../../lib/types.js";

interface LawnPresetProps {
  onSelect: (input: QuoteInput) => void;
}

export function LawnPreset({ onSelect }: LawnPresetProps) {
  return (
    <button
      type="button"
      className="preset-card"
      onClick={() =>
        onSelect({
          serviceType: "lawn_makeover",
          projectSize: 0.25,
          location: "Guildford",
          region: "south_east",
          qualityTier: "premium",
          urgency: "standard",
          extras: ["mulch_beds"]
        })
      }
    >
      <span className="preset-label">Preset</span>
      <strong>1/4 acre lawn makeover</strong>
      <p>Premium finish with mulch bed refresh.</p>
    </button>
  );
}
