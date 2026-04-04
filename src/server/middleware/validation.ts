import type { NextFunction, Request, Response } from "express";

export function requireJson(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.method === "POST" && !req.is("application/json")) {
    res.status(415).json({ error: "Content-Type must be application/json." });
    return;
  }

  next();
}
