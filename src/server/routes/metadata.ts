import type { Express, Request, Response } from "express";
import { appConfig } from "../../lib/app-config.js";
import { REGION_KEYS, QUALITY_TIERS, SERVICE_TYPES, URGENCY_LEVELS } from "../../lib/types.js";

export function registerMetadataRoute(app: Express): void {
  app.get("/metadata", (_req: Request, res: Response) => {
    res.json({
      name: appConfig.name,
      description: appConfig.description,
      version: appConfig.version,
      endpoints: {
        mcp: appConfig.mcpPath,
        health: appConfig.healthPath
      },
      supportedServices: SERVICE_TYPES,
      supportedRegions: REGION_KEYS,
      supportedTiers: QUALITY_TIERS,
      supportedUrgency: URGENCY_LEVELS
    });
  });
}
