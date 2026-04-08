import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifestPath = resolve(root, "dist/widget/.vite/manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const entry = manifest["src/components/app.tsx"];

if (!entry) {
  throw new Error("Widget manifest is missing src/components/app.tsx.");
}

const script = await readFile(resolve(root, "dist/widget", entry.file), "utf8");
const css = entry.css?.length
  ? (
      await Promise.all(
        entry.css.map((file) => readFile(resolve(root, "dist/widget", file), "utf8"))
      )
    ).join("\n")
  : "";

const outputDir = resolve(root, "src/generated");
const outputFile = resolve(outputDir, "widget-artifact.ts");

await mkdir(outputDir, { recursive: true });

const content = `export const widgetScript = ${JSON.stringify(script)};
export const widgetCss = ${JSON.stringify(css)};
`;

await writeFile(outputFile, content, "utf8");
