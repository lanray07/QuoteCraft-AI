import type { Express, Request, Response } from "express";

export function registerHealthRoute(app: Express): void {
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      service: "QuoteCraft AI",
      timestamp: new Date().toISOString()
    });
  });
}
