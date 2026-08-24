import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const jsonPath = join(root, "data", "plugins.json");
const outPath = join(root, "data", "plugins.bundle.js");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const bundle = "window.__DSH_PLUGIN_DATA__ = " + JSON.stringify(data) + ";\n";
writeFileSync(outPath, bundle, "utf8");
console.log("built " + outPath + " (" + bundle.length + " bytes, " + (data.plugins || []).length + " plugins)");
