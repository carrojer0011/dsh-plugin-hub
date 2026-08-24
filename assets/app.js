(function () {
  "use strict";

  var DATA = window.__DSH_PLUGIN_DATA__;
  if (!DATA || !DATA.plugins) {
    document.body.innerHTML = "<p style='padding:40px;color:#ff6b6b'>数据加载失败：请先运行 npm run build 生成 data/plugins.bundle.js</p>";
    return;
  }

  var plugins = DATA.plugins;
  var categories = DATA.categories || [];
  var meta = DATA.meta || {};
  var catMap = {};
  categories.forEach(function (c) { catMap[c.key] = c; });

  var state = { query: "", tags: [], category: "all", sort: "rank", showAllTags: false };
  var HOT_COUNT = 8;

  // ---- 计算 ----
  var maxStars = 1;
  plugins.forEach(function (p) { if (p.stars > maxStars) maxStars = p.stars; });

  function starScore(stars) { return Math.log10(stars + 1) / Math.log10(maxStars + 1) * 100; }
  function rankScore(p) { return 0.6 * starScore(p.stars) + 0.4 * p.matchScore; }
  function fmt(n) { return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

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

  function metaHtml(p) {
    var s = "";
    if (p.missing) s += "<span class=\"badge warn\">⚠️ 已失效</span>";
    else if (p.archived) s += "<span class=\"badge warn\">⚠️ 已归档</span>";
    if (p.pushedAt) s += "<span class=\"badge\">🕒 " + daysAgo(p.pushedAt) + "更新</span>";
    if (p.license) s += "<span class=\"badge\">📄 " + esc(p.license) + "</span>";
    if (p.language) s += "<span class=\"badge\">🔤 " + esc(p.language) + "</span>";
    return s ? "<div class=\"card-meta\">" + s + "</div>" : "";
  }

  // 标签 + 匹配度（热度）：Σ(含该标签插件的综合分)
  function computeTags() {
    var m = {};
    plugins.forEach(function (p) {
      (p.tags || []).forEach(function (t) {
        if (!m[t]) m[t] = { name: t, count: 0, heat: 0 };
        m[t].count++;
        m[t].heat += rankScore(p);
      });
    });
    var arr = Object.keys(m).map(function (k) { return m[k]; });
    arr.sort(function (a, b) { return b.heat - a.heat; });
    var maxHeat = arr.length ? arr[0].heat : 1;
    arr.forEach(function (t) { t.heatPct = Math.round(t.heat / maxHeat * 100); });
    return arr;
  }

  function matches(p) {
    if (state.category !== "all" && p.category !== state.category) return false;
    if (state.tags.length) {
      for (var i = 0; i < state.tags.length; i++) {
        if ((p.tags || []).indexOf(state.tags[i]) < 0) return false;
      }
    }
    if (state.query) {
      var q = state.query.toLowerCase();
      var hay = (p.name + " " + p.repo + " " + p.description + " " + p.summary + " " + (p.tags || []).join(" ")).toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  }

  function sorted() {
    return plugins.filter(matches).sort(function (a, b) {
      if (state.sort === "stars") return b.stars - a.stars;
      if (state.sort === "match") return b.matchScore - a.matchScore;
      return rankScore(b) - rankScore(a);
    });
  }

  // ---- 渲染 ----
  function catLabel(key) { var c = catMap[key]; return c ? (c.icon + " " + c.label) : key; }

  function chipHtml(t, active, hot) {
    var cls = "chip" + (active ? " active" : "") + (hot ? " hot" : "");
    return "<span class=\"" + cls + "\" data-tag=\"" + esc(t.name) + "\" title=\"匹配度 " + t.heatPct + " · " + t.count + " 个插件\">"
      + esc(t.name) + "<span class=\"cnt\">" + t.count + "</span></span>";
  }

  function renderPanel() {
    var tags = computeTags();
    var hot = tags.slice(0, HOT_COUNT);

    var hotHtml = "";
    hot.forEach(function (t) { hotHtml += chipHtml(t, state.tags.indexOf(t.name) >= 0, true); });
    document.getElementById("hot-tags").innerHTML = hotHtml;

    var allHtml = "";
    tags.forEach(function (t) { allHtml += chipHtml(t, state.tags.indexOf(t.name) >= 0, false); });
    document.getElementById("all-tags").innerHTML = allHtml;

    var selRow = document.getElementById("selected-row");
    var selBox = document.getElementById("selected-tags");
    if (state.tags.length) {
      var sHtml = "";
      state.tags.forEach(function (t) {
        sHtml += "<span class=\"chip selected\" data-tag=\"" + esc(t) + "\" title=\"点击移除\">" + esc(t) + "<span class=\"x\">×</span></span>";
      });
      selBox.innerHTML = sHtml;
      selRow.style.display = "flex";
    } else {
      selRow.style.display = "none";
    }

    document.getElementById("toggle-tags").textContent = state.showAllTags ? "收起标签 ▴" : "全部标签 ▾";
    document.getElementById("all-tags-row").style.display = state.showAllTags ? "flex" : "none";
  }

  function renderMustInstall() {
    var list = plugins.filter(function (p) { return p.mustInstall; })
      .sort(function (a, b) { return rankScore(b) - rankScore(a); });
    var el = document.getElementById("must-install");
    if (!list.length) { el.style.display = "none"; return; }

    var cards = "";
    list.forEach(function (p, i) {
      cards += "<a class=\"must-card\" href=\"plugin.html?id=" + encodeURIComponent(p.id) + "\">"
        + "<span class=\"rank-badge\"># " + (i + 1) + "</span>"
        + "<h3>" + esc(p.name) + "</h3>"
        + "<div class=\"cat\">" + esc(catLabel(p.category)) + "</div>"
        + "<p class=\"must-reason\">" + esc(p.mustInstallReason || p.summary) + "</p>"
        + "<div class=\"must-meta\"><span>⭐ " + fmt(p.stars) + "</span><span>🎯 匹配度 " + p.matchScore + "</span></div>"
        + "</a>";
    });

    el.innerHTML = "<div class=\"must-install-head\">"
      + "<span class=\"badge-fire\">🔥</span>"
      + "<h2>新手必装</h2>"
      + "<span class=\"hint\">按能力对比主流 agent + 新手需求精选，装完即补齐文本模型的常见短板</span>"
      + "</div><div class=\"must-grid\">" + cards + "</div>";
  }

  function renderCategories() {
    var sel = document.getElementById("category");
    var opts = "<option value=\"all\">全部分类</option>";
    categories.forEach(function (c) {
      var cnt = plugins.filter(function (p) { return p.category === c.key; }).length;
      opts += "<option value=\"" + esc(c.key) + "\">" + c.icon + " " + esc(c.label) + "（" + cnt + "）</option>";
    });
    sel.innerHTML = opts;
    sel.value = state.category;
  }

  function cardHtml(p) {
    var detailUrl = "plugin.html?id=" + encodeURIComponent(p.id);
    var mustFlag = p.mustInstall ? "<span class=\"must-flag\">🔥 新手必装</span>" : "";
    var install = "dsh plugin --profile web add " + p.repo;
    var tagsHtml = "";
    (p.tags || []).forEach(function (t) {
      var on = state.tags.indexOf(t) >= 0 ? " on" : "";
      tagsHtml += "<span class=\"mini-tag" + on + "\" data-tag=\"" + esc(t) + "\">" + esc(t) + "</span>";
    });
    return "<article class=\"card\" data-detail=\"" + esc(detailUrl) + "\">" + mustFlag
      + "<div class=\"card-top\">"
      + "<div><h3 class=\"card-title\"><a href=\"" + esc(detailUrl) + "\">" + esc(p.name) + "</a></h3>"
      + "<div class=\"card-cat\">" + esc(catLabel(p.category)) + " · " + esc(p.repo) + "</div></div>"
      + "<span class=\"star-badge\">⭐ " + fmt(p.stars) + "</span>"
      + "</div>"
      + metaHtml(p)
      + "<p class=\"card-desc\">" + esc(p.description) + "</p>"
      + "<p class=\"card-summary\">" + esc(p.summary) + "</p>"
      + "<div class=\"card-tags\">" + tagsHtml + "</div>"
      + "<div class=\"card-bottom\">"
      + "<div class=\"match\"><span class=\"val\">🎯 " + p.matchScore + "</span><span class=\"bar\"><i style=\"width:" + p.matchScore + "%\"></i></span></div>"
      + "<div class=\"card-actions\">"
      + "<button class=\"btn primary\" data-copy=\"" + esc(install) + "\" title=\"复制安装命令\">📋 复制安装链接</button>"
      + "<a class=\"btn\" href=\"" + esc(p.url) + "\" target=\"_blank\" rel=\"noopener\">GitHub ↗</a>"
      + "</div></div></article>";
  }

  function renderList() {
    var list = sorted();
    var stats = document.getElementById("stats");
    var box = document.getElementById("list");
    var empty = document.getElementById("empty");

    var filterNote = "";
    if (state.query) filterNote += "关键词「" + esc(state.query) + "」";
    if (state.tags.length) filterNote += (filterNote ? " + " : "") + "标签「" + esc(state.tags.join("、")) + "」";

    if (!list.length) {
      stats.innerHTML = "共 <b>" + plugins.length + "</b> 个插件 · 命中 <b>0</b> 个";
      box.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    // 按标签分组：每个插件出现在其所有标签对应的框里
    var groups = {};
    list.forEach(function (p) {
      (p.tags || []).forEach(function (t) {
        (groups[t] = groups[t] || []).push(p);
      });
    });

    // 框按标签热度排序（热门标签的框在前）
    var tagOrder = computeTags().map(function (t) { return t.name; });
    var tagNames = Object.keys(groups).sort(function (a, b) {
      var ia = tagOrder.indexOf(a), ib = tagOrder.indexOf(b);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });

    var html = "";
    tagNames.forEach(function (tag, idx) {
      var boxPlugins = groups[tag];
      // 新手必装优先置顶，其余保持当前排序
      var must = boxPlugins.filter(function (p) { return p.mustInstall; });
      var rest = boxPlugins.filter(function (p) { return !p.mustInstall; });
      var ordered = must.concat(rest);

      var cards = "";
      ordered.forEach(function (p) { cards += cardHtml(p); });

      var active = state.tags.indexOf(tag) >= 0 ? " active" : "";
      var isHot = idx < HOT_COUNT;
      html += "<section class=\"tag-section" + (isHot ? " expanded" : " collapsed") + "\">"
        + "<div class=\"tag-section-head\">"
        + "<span class=\"section-chevron\">" + (isHot ? "▾" : "▸") + "</span>"
        + "<button class=\"tag-title" + active + "\" data-tag=\"" + esc(tag) + "\" type=\"button\" title=\"点击筛选此标签\">" + esc(tag) + "</button>"
        + "<span class=\"tag-section-count\">" + boxPlugins.length + " 个插件</span>"
        + (must.length ? "<span class=\"tag-section-must\">🔥 含 " + must.length + " 个新手必装</span>" : "")
        + "</div>"
        + "<div class=\"tag-section-body\">" + cards + "</div>"
        + "</section>";
    });

    stats.innerHTML = "共 <b>" + plugins.length + "</b> 个插件 · 命中 <b>" + list.length + "</b> 个 · 分 <b>" + tagNames.length + "</b> 个标签框"
      + (filterNote ? " · " + filterNote : "")
      + " · <span class=\"legend\">框内综合排序 = ⭐Star 60% + 🎯匹配度 40%，新手必装置顶</span>";

    box.innerHTML = html;
  }

  function renderFooter() {
    var el = document.getElementById("footer-info");
    var updated = meta.updatedAt ? new Date(meta.updatedAt).toLocaleString("zh-CN") : "未知";
    el.innerHTML = "<span>🐋 DSH 插件库 · 收录 " + plugins.length + " 个插件</span>"
      + "<span>数据源：<a href=\"" + esc(meta.source || "#") + "\" target=\"_blank\" rel=\"noopener\">GitHub topic:dsh-plugin</a></span>"
      + "<span>最近更新：" + esc(updated) + "</span>"
      + "<span>安装第三方插件会在本机执行代码，请先审阅源码</span>";
  }

  function renderHero() {
    var el = document.getElementById("hero-stats");
    if (!el) return;
    var tags = computeTags();
    var must = plugins.filter(function (p) { return p.mustInstall; }).length;
    var stats = [
      { num: plugins.length, label: "收录插件" },
      { num: tags.length, label: "能力标签" },
      { num: must, label: "新手必装" },
      { num: "每日", label: "自动更新" },
    ];
    var html = "";
    stats.forEach(function (s) {
      html += "<div class=\"hero-stat\"><span class=\"hero-num\">" + s.num + "</span><span class=\"hero-label\">" + s.label + "</span></div>";
    });
    el.innerHTML = html;
  }

  function render() {
    renderHero();
    renderMustInstall();
    renderCategories();
    renderPanel();
    renderList();
    renderFooter();
  }

  // ---- 事件 ----
  function bind() {
    document.getElementById("search").addEventListener("input", function (e) {
      state.query = e.target.value.trim();
      renderList();
    });
    document.getElementById("sort").addEventListener("change", function (e) {
      state.sort = e.target.value;
      renderList();
    });
    document.getElementById("category").addEventListener("change", function (e) {
      state.category = e.target.value;
      renderList();
    });
    document.getElementById("toggle-tags").addEventListener("click", function () {
      state.showAllTags = !state.showAllTags;
      renderPanel();
    });
    document.getElementById("clear-tags").addEventListener("click", function () {
      state.tags = [];
      renderPanel();
      renderList();
    });

    document.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-tag]");
      if (chip) {
        var t = chip.getAttribute("data-tag");
        var i = state.tags.indexOf(t);
        if (i >= 0) state.tags.splice(i, 1); else state.tags.push(t);
        renderPanel();
        renderList();
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
        return;
      }
      var head = e.target.closest(".tag-section-head");
      if (head) {
        var sec = head.closest(".tag-section");
        if (sec) {
          sec.classList.toggle("collapsed");
          sec.classList.toggle("expanded");
          var ch = head.querySelector(".section-chevron");
          if (ch) ch.textContent = sec.classList.contains("collapsed") ? "▸" : "▾";
        }
        return;
      }
      var card = e.target.closest(".card[data-detail]");
      if (card && !e.target.closest("a, button")) {
        location.href = card.getAttribute("data-detail");
      }
    });
  }

  bind();
  // 预置 URL 参数（来自详情页标签/分类/搜索跳转）
  try {
    var up = new URLSearchParams(location.search);
    var pt = up.get("tag");
    if (pt && state.tags.indexOf(pt) < 0) state.tags.push(pt);
    var pc = up.get("category");
    if (pc) state.category = pc;
    var pq = up.get("q");
    if (pq) { state.query = pq; document.getElementById("search").value = pq; }
  } catch (err) {}
  render();
})();
