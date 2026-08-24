(function () {
  "use strict";

  var DATA = window.__DSH_PLUGIN_DATA__;
  var box = document.getElementById("detail");

  if (!DATA || !DATA.plugins) {
    box.innerHTML = "<p style='padding:40px;color:#e0533d'>数据加载失败：请先运行 npm run build 生成 data/plugins.bundle.js</p>";
    return;
  }

  var plugins = DATA.plugins;
  var categories = DATA.categories || [];
  var catMap = {};
  categories.forEach(function (c) { catMap[c.key] = c; });

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function catLabel(key) { var c = catMap[key]; return c ? (c.icon + " " + c.label) : key; }

  function daysAgo(iso) {
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

  function related(p) {
    var scored = [];
    plugins.forEach(function (x) {
      if (x.id === p.id) return;
      var overlap = 0;
      (p.tags || []).forEach(function (t) { if ((x.tags || []).indexOf(t) >= 0) overlap++; });
      var sameCat = x.category === p.category ? 1 : 0;
      scored.push({ p: x, score: overlap * 2 + sameCat });
    });
    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return b.p.stars - a.p.stars;
    });
    return scored.filter(function (s) { return s.score > 0; }).slice(0, 6).map(function (s) { return s.p; });
  }

  var id = "";
  try { id = new URLSearchParams(location.search).get("id") || ""; } catch (e) {}

  var p = null;
  for (var i = 0; i < plugins.length; i++) { if (plugins[i].id === id) { p = plugins[i]; break; } }

  // ---- 未找到 ----
  if (!p) {
    document.title = "未找到插件 · DSH 插件库";
    var links = "";
    plugins.forEach(function (x) {
      links += "<a href=\"plugin.html?id=" + encodeURIComponent(x.id) + "\">" + esc(x.name) + "</a>";
    });
    box.innerHTML = "<div class=\"notfound\">"
      + "<h2>未找到该插件</h2><p>id 可能不正确，请从下面选择一个：</p>"
      + "<div class=\"all\">" + links + "</div>"
      + "<a class=\"back-link\" href=\"index.html\">← 返回插件库</a></div>";
    return;
  }

  document.title = p.name + " · DSH 插件库";

  var install = "dsh plugin --profile web add " + p.repo;
  var mustBadge = p.mustInstall ? "<span class=\"must-flag-inline\">🔥 新手必装</span>" : "";

  var tagsHtml = "";
  (p.tags || []).forEach(function (t) {
    tagsHtml += "<a class=\"mini-tag\" href=\"index.html?tag=" + encodeURIComponent(t) + "\">" + esc(t) + "</a>";
  });

  var mustBlock = p.mustInstall
    ? "<div class=\"detail-must\"><strong>🔥 新手必装理由：</strong>" + esc(p.mustInstallReason || "") + "</div>"
    : "";

  var html = "";
  html += "<nav class=\"crumbs\">"
    + "<a href=\"index.html\">DSH 插件库</a><span class=\"sep\">/</span>"
    + "<a href=\"index.html?category=" + encodeURIComponent(p.category) + "\">" + esc(catLabel(p.category)) + "</a><span class=\"sep\">/</span>"
    + "<span>" + esc(p.name) + "</span></nav>";

  html += "<div class=\"detail-head\">"
    + "<h1 class=\"detail-title\">" + esc(p.name) + "</h1>"
    + "<div class=\"detail-badges\"><span class=\"star-badge\">⭐ " + p.stars + "</span>" + mustBadge + "</div>"
    + "</div>";

  html += "<div class=\"detail-meta\">"
    + "<span>分类：<a href=\"index.html?category=" + encodeURIComponent(p.category) + "\">" + esc(catLabel(p.category)) + "</a></span>"
    + "<span>仓库：<a href=\"" + esc(p.url) + "\" target=\"_blank\" rel=\"noopener\">" + esc(p.repo) + "</a></span>"
    + "<span>⭐ " + p.stars + "</span>"
    + (typeof p.forks === "number" ? "<span>🍴 " + p.forks + "</span>" : "")
    + (typeof p.openIssues === "number" ? "<span>🐞 " + p.openIssues + "</span>" : "")
    + (p.license ? "<span>📄 " + esc(p.license) + "</span>" : "")
    + (p.language ? "<span>🔤 " + esc(p.language) + "</span>" : "")
    + (p.pushedAt ? "<span>🕒 " + daysAgo(p.pushedAt) + "更新</span>" : "")
    + (p.missing ? "<span class=\"warn\">⚠️ 已失效</span>" : (p.archived ? "<span class=\"warn\">⚠️ 已归档</span>" : ""))
    + "</div>";

  html += "<div class=\"detail-tags\">" + tagsHtml + "</div>";

  html += "<div class=\"detail-block\"><h3>功能简介</h3><p>" + esc(p.description) + "</p></div>";
  html += "<div class=\"detail-block review\"><h3>💬 AI 点评</h3><p>" + esc(p.summary) + "</p></div>";

  html += "<div class=\"detail-block\"><h3>能力匹配度</h3>"
    + "<div class=\"match-bar\"><span class=\"score\">" + p.matchScore + "</span><span class=\"bar\"><i style=\"width:" + p.matchScore + "%\"></i></span></div>"
    + "<p class=\"detail-hint\">0–100：插件核心能力的完整度 + 易用性 + 对 DSH 的适配度（本站 AI 策展评估）</p></div>";

  html += "<div class=\"detail-actions\">"
    + "<button class=\"btn primary\" data-copy=\"" + esc(install) + "\">📋 复制安装链接</button>"
    + "<a class=\"btn\" href=\"" + esc(p.url) + "\" target=\"_blank\" rel=\"noopener\">下载地址 ↗ GitHub</a>"
    + "<button class=\"btn fav-btn\" data-fav=\"" + esc(p.id) + "\">" + (window.__DSH_FAV__ && window.__DSH_FAV__.has(p.id) ? "⭐ 已收藏" : "☆ 收藏") + "</button>"
    + "</div>";

  html += "<div class=\"install-cmd\">" + esc(install) + "</div>";
  html += mustBlock;
  var rel = related(p);
  if (rel.length) {
    var relHtml = "";
    rel.forEach(function (x) {
      relHtml += "<a class=\"related-card\" href=\"plugin.html?id=" + encodeURIComponent(x.id) + "\">"
        + "<span class=\"related-name\">" + esc(x.name) + "</span>"
        + "<span class=\"related-meta\">⭐ " + x.stars + " · " + esc(catLabel(x.category)) + "</span>"
        + "</a>";
    });
    html += "<div class=\"related\"><h3>相关插件</h3><div class=\"related-grid\">" + relHtml + "</div></div>";
  }
  html += "<a class=\"back-link\" href=\"index.html\">← 返回插件库</a>";

  box.innerHTML = "<div class=\"detail-card\">" + html + "</div>";

  document.addEventListener("click", function (e) {
    var fav = e.target.closest("[data-fav]");
    if (fav) {
      var fid = fav.getAttribute("data-fav");
      if (window.__DSH_FAV__) {
        var on = window.__DSH_FAV__.toggle(fid);
        fav.textContent = on ? "⭐ 已收藏" : "☆ 收藏";
      }
      return;
    }
    var copy = e.target.closest("[data-copy]");
    if (!copy) return;
    var cmd = copy.getAttribute("data-copy");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cmd).then(function () {
        copy.textContent = "✅ 已复制";
        setTimeout(function () { copy.textContent = "📋 复制安装链接"; }, 1500);
      });
    } else {
      window.prompt("复制安装命令：", cmd);
    }
  });
})();
