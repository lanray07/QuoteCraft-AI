import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createQuoteCraftApp } from "../src/server/app.js";

const appPromise = createQuoteCraftApp("0.0.0.0");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await appPromise;
  return app(req, res);
}
