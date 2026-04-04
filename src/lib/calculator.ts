import { readFile } from "node:fs/promises";
import type {
  MarkupConfig,
  PricingRulesConfig
} from "./types.js";

let pricingRulesCache: PricingRulesConfig | null = null;
let markupConfigCache: MarkupConfig | null = null;

export async function readJsonFile<T>(fileName: string): Promise<T> {
  const fileUrl = new URL(`../data/${fileName}`, import.meta.url);
  const file = await readFile(fileUrl, "utf8");
  return JSON.parse(file) as T;
}

export function roundMoney(value: number): number {
  return Math.round(value);
}

export function getPricingRules(): PricingRulesConfig {
  if (!pricingRulesCache) {
    throw new Error("Pricing rules have not been loaded yet. Call warmPricingData() during server startup.");
  }

  return pricingRulesCache;
}

export async function getMarkupConfig(): Promise<MarkupConfig> {
  if (!markupConfigCache) {
    markupConfigCache = await readJsonFile<MarkupConfig>("markup-config.json");
  }

  return markupConfigCache;
}

export async function warmPricingData(): Promise<void> {
  if (!pricingRulesCache) {
    pricingRulesCache = await readJsonFile<PricingRulesConfig>("pricing-rules.json");
  }

  if (!markupConfigCache) {
    markupConfigCache = await readJsonFile<MarkupConfig>("markup-config.json");
  }
}
