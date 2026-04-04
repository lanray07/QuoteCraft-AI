import type { RegionKey, RegionalMultipliersConfig } from "./types.js";
import { readJsonFile } from "./calculator.js";

let regionalCache: RegionalMultipliersConfig | null = null;

export async function getRegionalMultipliers(): Promise<RegionalMultipliersConfig> {
  if (!regionalCache) {
    regionalCache = await readJsonFile<RegionalMultipliersConfig>("regional-multipliers.json");
  }

  return regionalCache;
}

export async function getRegionalMultiplier(region: RegionKey): Promise<number> {
  const config = await getRegionalMultipliers();
  return config[region]?.multiplier ?? config.default.multiplier;
}
