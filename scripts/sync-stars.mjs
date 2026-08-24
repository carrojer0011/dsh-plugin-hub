import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const jsonPath = join(root, "data", "plugins.json");
const outPath = join(root, "data", "plugins.bundle.js");

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const plugins = data.plugins || [];

async function fetchRepo(repo) {
  const headers = { "User-Agent": "dsh-plugin-hub", Accept: "application/vnd.github+json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  return await fetch("https://api.github.com/repos/" + repo, { headers });
}

let ok = 0, fail = 0, skipped = 0, rateLimited = false;

for (const p of plugins) {
  try {
    const r = await fetchRepo(p.repo);
    if (r.status === 200) {
      const j = await r.json();
      if (typeof j.stargazers_count === "number") {
        p.stars = j.stargazers_count;
        delete p.missing;
        ok++;
      }
      p.pushedAt = j.pushed_at || null;
      p.archived = !!j.archived;
      p.license = (j.license && j.license.spdx_id) || null;
      p.language = j.language || null;
      p.openIssues = typeof j.open_issues_count === "number" ? j.open_issues_count : null;
      p.forks = typeof j.forks_count === "number" ? j.forks_count : null;
    } else if (r.status === 403 || r.status === 429) {
      rateLimited = true;
      skipped++;
      break;
    } else if (r.status === 404) {
      p.missing = true;
      fail++;
    } else {
      fail++;
    }
  } catch (e) {
    fail++;
    console.log("ERR " + p.repo + ": " + (e && e.message ? e.message : e));
  }
  await new Promise(function (res) { setTimeout(res, 200); });
}

data.meta = data.meta || {};
data.meta.updatedAt = new Date().toISOString();
data.meta.syncStatus = rateLimited ? "partial (rate limited)" : "full";
writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");

// 重新生成 bundle
const bundle = "window.__DSH_PLUGIN_DATA__ = " + JSON.stringify(data) + ";\n";
writeFileSync(outPath, bundle, "utf8");

console.log("sync done: ok=" + ok + " fail=" + fail + " skipped=" + skipped + (rateLimited ? " (RATE LIMITED, 请提供 GITHUB_TOKEN)" : ""));
