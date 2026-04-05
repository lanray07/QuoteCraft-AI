import type { Express, Request, Response } from "express";

const pageShell = (title: string, body: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} | QuoteCraft AI</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "Segoe UI", Arial, sans-serif;
        background: #f7f1e7;
        color: #1f1a17;
      }
      body {
        margin: 0;
        padding: 32px 20px 60px;
        background:
          radial-gradient(circle at top left, rgba(214, 166, 98, 0.25), transparent 28%),
          linear-gradient(180deg, #faf6ef 0%, #f4ead9 100%);
      }
      main {
        max-width: 840px;
        margin: 0 auto;
        background: rgba(255, 252, 247, 0.94);
        border: 1px solid rgba(58, 39, 24, 0.12);
        border-radius: 24px;
        padding: 32px;
        box-shadow: 0 18px 44px rgba(50, 32, 17, 0.08);
      }
      h1, h2 {
        font-family: Georgia, serif;
        letter-spacing: -0.02em;
      }
      h1 {
        margin-top: 0;
      }
      p, li {
        line-height: 1.65;
      }
      .eyebrow {
        color: #115e59;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      a {
        color: #0f766e;
      }
    </style>
  </head>
  <body>
    <main>${body}</main>
  </body>
</html>`;

export function registerLegalRoutes(app: Express): void {
  app.get("/privacy", (_req: Request, res: Response) => {
    res
      .type("html")
      .send(
        pageShell(
          "Privacy Policy",
          `
          <p class="eyebrow">QuoteCraft AI</p>
          <h1>Privacy Policy</h1>
          <p>Last updated: April 5, 2026</p>
          <p>QuoteCraft AI helps users create deterministic service-business quotes inside ChatGPT. This policy explains what information the app processes and how that information is used.</p>

          <h2>Information we process</h2>
          <ul>
            <li>Project details entered by the user, such as service type, project size, location, pricing tier, urgency, and selected extras.</li>
            <li>Technical request data needed to operate the app, such as standard server logs and request metadata.</li>
          </ul>

          <h2>How we use information</h2>
          <ul>
            <li>To calculate and return quote estimates requested by the user.</li>
            <li>To operate, secure, monitor, and improve the reliability of the service.</li>
          </ul>

          <h2>How pricing works</h2>
          <p>QuoteCraft AI uses deterministic, configuration-based pricing logic. It does not use hidden AI-generated pricing estimates or undisclosed third-party pricing enrichment for quote totals.</p>

          <h2>Data storage</h2>
          <p>The current version of QuoteCraft AI does not intentionally provide user accounts or long-term saved quote history. Operational logs may be retained by the hosting provider for reliability and security purposes.</p>

          <h2>Third-party services</h2>
          <p>QuoteCraft AI is deployed using third-party infrastructure providers, including OpenAI and Vercel. Those providers may process data as part of hosting, routing, and app execution.</p>

          <h2>Your choices</h2>
          <p>Please avoid submitting sensitive personal information, payment card data, medical data, or other highly confidential information through the app.</p>

          <h2>Contact</h2>
          <p>For privacy questions, contact the app operator using the support contact listed in the app submission details.</p>
          `
        )
      );
  });

  app.get("/terms", (_req: Request, res: Response) => {
    res
      .type("html")
      .send(
        pageShell(
          "Terms of Use",
          `
          <p class="eyebrow">QuoteCraft AI</p>
          <h1>Terms of Use</h1>
          <p>Last updated: April 5, 2026</p>
          <p>These Terms of Use govern access to and use of QuoteCraft AI.</p>

          <h2>Service description</h2>
          <p>QuoteCraft AI provides estimate-generation tools for service-business quoting workflows. Quotes are informational and intended to support draft proposal creation.</p>

          <h2>No guaranteed final pricing</h2>
          <p>All quote outputs are estimates only. Final pricing depends on actual site conditions, scope confirmation, local market conditions, access constraints, taxes, permit requirements, and other job-specific factors.</p>

          <h2>User responsibility</h2>
          <ul>
            <li>You are responsible for reviewing all estimates before sharing them with clients.</li>
            <li>You should confirm local costs, labor assumptions, and regulatory requirements before relying on an estimate for a binding proposal.</li>
          </ul>

          <h2>Acceptable use</h2>
          <p>You may not use QuoteCraft AI in a way that is unlawful, harmful, fraudulent, or intended to interfere with the service.</p>

          <h2>Disclaimer</h2>
          <p>The service is provided on an “as is” and “as available” basis without warranties of any kind, to the extent permitted by law.</p>

          <h2>Limitation of liability</h2>
          <p>To the extent permitted by law, the app operator is not liable for indirect, incidental, special, consequential, or business-loss damages arising from use of the service or reliance on estimate outputs.</p>

          <h2>Changes</h2>
          <p>These terms may be updated from time to time by posting a revised version on this page.</p>

          <h2>Contact</h2>
          <p>For questions about these terms, use the support contact listed with the app.</p>
          `
        )
      );
  });
}
