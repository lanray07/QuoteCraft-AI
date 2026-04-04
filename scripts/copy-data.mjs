import { cp, mkdir } from "node:fs/promises";

const distData = new URL("../dist/data", import.meta.url);

await mkdir(distData, { recursive: true });
await cp(new URL("../src/data", import.meta.url), distData, { recursive: true });
