import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const jsonPath = join(root, "data", "plugins.json");
const readmePath = join(root, "README.md");
const NL = String.fromCharCode(10);

const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const plugins = data.plugins || [];
const categories = data.categories || [];
const meta = data.meta || {};

const tagSet = {};
plugins.forEach(function (p) { (p.tags || []).forEach(function (t) { tagSet[t] = 1; }); });
let totalStars = 0;
plugins.forEach(function (p) { totalStars += p.stars || 0; });
const mustCount = plugins.filter(function (p) { return p.mustInstall; }).length;
const updated = meta.updatedAt || meta.enrichedAt || "";
const updatedStr = updated ? new Date(updated).toISOString().slice(0, 10) : "-";

const rows = [
  ["收录插件", String(plugins.length)],
  ["能力分类", String(categories.length)],
  ["能力标签", String(Object.keys(tagSet).length)],
  ["新手必装", String(mustCount)],
  ["总 Star", totalStars.toLocaleString("en-US")],
  ["数据更新", updatedStr],
];
const lines = ["| 指标 | 数值 |", "| --- | --- |"];
rows.forEach(function (r) { lines.push("| " + r[0] + " | " + r[1] + " |"); });
const block = "<!-- AUTO-STATS:START -->" + NL + lines.join(NL) + NL + "<!-- AUTO-STATS:END -->";

let readme = readFileSync(readmePath, "utf8");
const start = "<!-- AUTO-STATS:START -->";
const end = "<!-- AUTO-STATS:END -->";
const si = readme.indexOf(start);
const ei = readme.indexOf(end);
if (si >= 0 && ei >= 0) {
  readme = readme.slice(0, si) + block + readme.slice(ei + end.length);
} else {
  readme = readme + NL + NL + block;
}
writeFileSync(readmePath, readme, "utf8");
console.log("README 统计已更新（" + plugins.length + " 个插件）");
