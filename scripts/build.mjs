import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const jsonPath = join(root, "data", "plugins.json");
const outPath = join(root, "data", "plugins.bundle.js");
const pluginDir = join(root, "plugin");
const SITE_BASE = "https://carrojer0011.github.io/dsh-plugin-hub";
const NL = String.fromCharCode(10);
const GISCUS = '<script src="https://giscus.app/client.js" data-repo="carrojer0011/dsh-plugin-hub" data-repo-id="R_kgDOUCLRxw" data-category="Announcements" data-category-id="DIC_kwDOUCLRx84DEEBT" data-mapping="pathname" data-strict="0" data-reactions-enabled="1" data-emit-metadata="0" data-input-position="top" data-theme="gruvbox_light" data-lang="zh-CN" data-loading="lazy" crossorigin="anonymous" async></script>';

const data = JSON.parse(readFileSync(jsonPath, "utf8"));
const plugins = data.plugins || [];
const categories = data.categories || [];
const catMap = {};
categories.forEach(function (c) { catMap[c.key] = c; });

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function catLabel(key) { var c = catMap[key]; return c ? (c.icon + " " + c.label) : key; }
function daysAgo(iso) {
  if (!iso) return "";
  try {
    var d = new Date(iso);
    var days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) return "今天";
    if (days === 1) return "1天前";
    if (days < 30) return days + "天前";
    var m = Math.floor(days / 30);
    if (m < 12) return m + "个月前";
    return Math.floor(m / 12) + "年前";
  } catch (e) { return ""; }
}

function page(p) {
  var install = "dsh plugin --profile web add " + p.repo;
  var must = p.mustInstall ? '<span class="must-flag-inline">🔥 新手必装</span>' : "";
  var mustBlock = p.mustInstall ? '<div class="detail-must"><strong>🔥 新手必装理由：</strong>' + esc(p.mustInstallReason || "") + "</div>" : "";
  var warn = p.missing ? '<span class="warn">⚠️ 已失效</span>' : (p.archived ? '<span class="warn">⚠️ 已归档</span>' : "");
  var tags = "";
  (p.tags || []).forEach(function (t) {
    tags += '<a class="mini-tag" href="../index.html?tag=' + encodeURIComponent(t) + '">' + esc(t) + "</a>";
  });
  var url = SITE_BASE + "/plugin/" + encodeURIComponent(p.id) + ".html";
  var catHref = "../index.html?category=" + encodeURIComponent(p.category);

  var L = [];
  L.push("<!DOCTYPE html>");
  L.push('<html lang="zh-CN">');
  L.push("<head>");
  L.push('  <meta charset="UTF-8" />');
  L.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0" />');
  L.push("  <title>" + esc(p.name) + " · DSH 插件库</title>");
  L.push('  <meta name="description" content="' + esc(p.summary) + '" />');
  L.push('  <meta property="og:title" content="' + esc(p.name) + ' · DSH 插件库" />');
  L.push('  <meta property="og:description" content="' + esc(p.summary) + '" />');
  L.push('  <meta property="og:type" content="website" />');
  L.push('  <meta property="og:url" content="' + url + '" />');
  L.push('  <link rel="canonical" href="' + url + '" />');
  L.push('  <link rel="stylesheet" href="../assets/style.css" />');
  L.push('  <script src="../assets/theme.js"></script>');
  L.push('  <script src="../assets/favorites.js"></script>');
  L.push("</head>");
  L.push("<body>");
  L.push('  <header class="site-header">');
  L.push('    <div class="wrap header-inner">');
  L.push('      <a class="brand" href="../index.html"><span class="logo">🐋</span><span class="brand-name">DSH 插件库</span></a>');
  L.push('      <nav class="nav">');
  L.push('        <a href="../index.html">← 返回目录</a>');
  L.push('        <button class="theme-toggle" type="button" aria-label="切换主题">🌙</button>');
  L.push("      </nav>");
  L.push("    </div>");
  L.push("  </header>");
  L.push('  <main class="wrap detail">');
  L.push('    <div class="detail-card">');
  L.push('      <nav class="crumbs">');
  L.push('        <a href="../index.html">DSH 插件库</a><span class="sep">/</span>');
  L.push('        <a href="' + catHref + '">' + esc(catLabel(p.category)) + '</a><span class="sep">/</span>');
  L.push("        <span>" + esc(p.name) + "</span>");
  L.push("      </nav>");
  L.push('      <div class="detail-head">');
  L.push('        <h1 class="detail-title">' + esc(p.name) + "</h1>");
  L.push('        <div class="detail-badges"><span class="star-badge" data-star>⭐ ' + p.stars + "</span>" + must + "</div>");
  L.push("      </div>");
  L.push('      <div class="detail-meta">');
  L.push('        <span>分类：<a href="' + catHref + '">' + esc(catLabel(p.category)) + "</a></span>");
  L.push('        <span>仓库：<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.repo) + "</a></span>");
  L.push('        <span data-star-inline>⭐ ' + p.stars + "</span>");
  if (typeof p.forks === "number") L.push("        <span>🍴 " + p.forks + "</span>");
  if (typeof p.openIssues === "number") L.push("        <span>🐞 " + p.openIssues + "</span>");
  if (p.license) L.push("        <span>📄 " + esc(p.license) + "</span>");
  if (p.language) L.push("        <span>🔤 " + esc(p.language) + "</span>");
  if (p.pushedAt) L.push('        <span data-pushed>🕒 ' + daysAgo(p.pushedAt) + "更新</span>");
  if (warn) L.push("        " + warn);
  L.push("      </div>");
  L.push('      <div class="detail-tags">' + tags + "</div>");
  L.push('      <div class="detail-block"><h3>功能简介</h3><p>' + esc(p.description) + "</p></div>");
  L.push('      <div class="detail-block review"><h3>💬 AI 点评</h3><p>' + esc(p.summary) + "</p></div>");
  L.push('      <div class="detail-block"><h3>能力匹配度</h3>');
  L.push('        <div class="match-bar"><span class="score">' + p.matchScore + '</span><span class="bar"><i style="width:' + p.matchScore + '%"></i></span></div>');
  L.push('        <p class="detail-hint">0–100：插件核心能力的完整度 + 易用性 + 对 DSH 的适配度（本站 AI 策展评估）</p>');
  L.push("      </div>");
  L.push('      <div class="detail-actions">');
  L.push('        <button class="btn primary" data-copy="' + esc(install) + '">📋 复制安装链接</button>');
  L.push('        <a class="btn" href="' + esc(p.url) + '" target="_blank" rel="noopener">下载地址 ↗ GitHub</a>');
  L.push('        <button class="btn fav-btn" data-fav="' + esc(p.id) + '">☆ 收藏</button>');
  L.push("      </div>");
  L.push('      <div class="install-cmd">' + esc(install) + "</div>");
  if (mustBlock) L.push("      " + mustBlock);
  L.push('      <div class="related" data-related><h3>相关插件</h3><div class="related-grid" data-related-grid></div></div>');
  L.push('      <div class="giscus-wrap"><h3>💬 评论</h3>');
  L.push('      ' + GISCUS);
  L.push('      </div>');
  L.push('      <a class="back-link" href="../index.html">← 返回插件库</a>');
  L.push("    </div>");
  L.push("  </main>");
  L.push('  <footer class="site-footer">');
  L.push('    <div class="wrap"><span>🐋 DSH 插件库 · 安装第三方插件会在本机执行代码，请先审阅源码</span></div>');
  L.push("  </footer>");
  L.push('  <script src="../data/plugins.bundle.js"></script>');
  L.push("  <script>window.__PLUGIN_ID__ = " + JSON.stringify(p.id) + ";</script>");
  L.push('  <script src="../assets/plugin-detail.js"></script>');
  L.push("</body>");
  L.push("</html>");
  return L.join(NL);
}

// 1) 生成 bundle
const bundle = "window.__DSH_PLUGIN_DATA__ = " + JSON.stringify(data) + ";";
writeFileSync(outPath, bundle, "utf8");

// 2) 生成静态详情页
mkdirSync(pluginDir, { recursive: true });
plugins.forEach(function (p) {
  writeFileSync(join(pluginDir, p.id + ".html"), page(p), "utf8");
});

// 3) sitemap.xml
var sitemap = ['<?xml version="1.0" encoding="UTF-8"?>'];
sitemap.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
sitemap.push("  <url><loc>" + SITE_BASE + "/</loc></url>");
plugins.forEach(function (p) {
  sitemap.push("  <url><loc>" + SITE_BASE + "/plugin/" + encodeURIComponent(p.id) + ".html</loc></url>");
});
sitemap.push("</urlset>");
writeFileSync(join(root, "sitemap.xml"), sitemap.join(NL), "utf8");

// 4) robots.txt
writeFileSync(join(root, "robots.txt"), ["User-agent: *", "Allow: /", "Sitemap: " + SITE_BASE + "/sitemap.xml"].join(NL), "utf8");

console.log("built: bundle + " + plugins.length + " 个静态页 + sitemap + robots");
