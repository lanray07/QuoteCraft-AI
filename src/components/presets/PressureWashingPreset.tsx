import type { QuoteInput } from "../../lib/types.js";

interface PressureWashingPresetProps {
  onSelect: (input: QuoteInput) => void;
}

export function PressureWashingPreset({ onSelect }: PressureWashingPresetProps) {
  return (
    <button
      type="button"
      className="preset-card"
      onClick={() =>
        onSelect({
          serviceType: "pressure_washing",
          projectSize: 1200,
          location: "Manchester",
          region: "north_west",
          qualityTier: "standard",
          urgency: "urgent",
          extras: ["degreasing", "mildew_treatment"]
        })
      }
    >
      <span className="preset-label">Preset</span>
      <strong>Driveway + patio wash</strong>
      <p>Urgent clean with degreasing and mildew treatment.</p>
    </button>
  );
}
