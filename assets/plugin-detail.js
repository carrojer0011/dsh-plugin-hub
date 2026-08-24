(function () {
  "use strict";
  var id = window.__PLUGIN_ID__;
  var DATA = window.__DSH_PLUGIN_DATA__;
  if (!id || !DATA || !DATA.plugins) return;
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

  var p = null;
  for (var i = 0; i < plugins.length; i++) { if (plugins[i].id === id) { p = plugins[i]; break; } }
  if (!p) return;

  // 动态 star + 更新时间
  var stars = document.querySelectorAll("[data-star]");
  for (var j = 0; j < stars.length; j++) stars[j].textContent = "⭐ " + p.stars;
  var pushed = document.querySelector("[data-pushed]");
  if (pushed && p.pushedAt) pushed.textContent = "🕒 " + daysAgo(p.pushedAt) + "更新";

  // 收藏按钮初始态
  var fav = document.querySelector("[data-fav]");
  if (fav && window.__DSH_FAV__) fav.textContent = window.__DSH_FAV__.has(p.id) ? "⭐ 已收藏" : "☆ 收藏";

  // 相关插件
  var relGrid = document.querySelector("[data-related-grid]");
  var relBox = document.querySelector("[data-related]");
  if (relGrid) {
    var rel = related(p);
    if (rel.length) {
      var html = "";
      rel.forEach(function (x) {
        html += '<a class="related-card" href="' + encodeURIComponent(x.id) + '.html">'
          + '<span class="related-name">' + esc(x.name) + '</span>'
          + '<span class="related-meta">⭐ ' + x.stars + ' · ' + esc(catLabel(x.category)) + '</span></a>';
      });
      relGrid.innerHTML = html;
    } else if (relBox) {
      relBox.style.display = "none";
    }
  }

  function related(cur) {
    var scored = [];
    plugins.forEach(function (x) {
      if (x.id === cur.id) return;
      var overlap = 0;
      (cur.tags || []).forEach(function (t) { if ((x.tags || []).indexOf(t) >= 0) overlap++; });
      var sameCat = x.category === cur.category ? 1 : 0;
      scored.push({ p: x, score: overlap * 2 + sameCat });
    });
    scored.sort(function (a, b) { if (b.score !== a.score) return b.score - a.score; return b.p.stars - a.p.stars; });
    return scored.filter(function (s) { return s.score > 0; }).slice(0, 6).map(function (s) { return s.p; });
  }

  document.addEventListener("click", function (e) {
    var favBtn = e.target.closest("[data-fav]");
    if (favBtn) {
      if (window.__DSH_FAV__) {
        var on = window.__DSH_FAV__.toggle(p.id);
        favBtn.textContent = on ? "⭐ 已收藏" : "☆ 收藏";
      }
      return;
    }
    var copy = e.target.closest("[data-copy]");
    if (copy) {
      var cmd = copy.getAttribute("data-copy");
      if (navigator.clipboard) {
        navigator.clipboard.writeText(cmd).then(function () {
          copy.textContent = "✅ 已复制";
          setTimeout(function () { copy.textContent = "📋 复制安装链接"; }, 1500);
        });
      } else {
        window.prompt("复制安装命令：", cmd);
      }
    }
  });
})();
