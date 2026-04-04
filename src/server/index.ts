import { appConfig } from "../lib/app-config.js";
import { createQuoteCraftApp } from "./app.js";

async function main() {
  const host = process.env.HOST ?? "0.0.0.0";
  const port = Number(process.env.PORT ?? 3000);
  const app = await createQuoteCraftApp(host);

  app.listen(port, host, () => {
    console.log(`${appConfig.name} listening on http://${host}:${port}`);
  });
}

void main();
