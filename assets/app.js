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

  var state = { query: "", tags: [], category: "all", sort: "rank", showAllTags: false, fav: false, aiQuery: "" };
  var HOT_COUNT = 8;

  // 智能选型：能力标签 -> 同义表达（中英）
  var AI_ALIASES = {
    "视觉": ["看图", "视觉", "图像", "图片", "ocr", "识图", "识别图片", "截图", "截图理解", "图像理解", "多模态", "vision", "image", "screenshot", "像素", "看得见"],
    "记忆": ["记忆", "长期记忆", "记住", "上下文记忆", "持久记忆", "知识库", "知识图谱", "memory", "remember", "knowledge", "回忆", "记忆管理", "不要忘"],
    "自进化": ["自进化", "自我进化", "进化", "自我学习", "self-evolving", "自我改进", "越用越聪明"],
    "上下文": ["上下文", "上下文管理", "上下文压缩", "上下文洞察", "context", "上下文优化", "语境"],
    "编码": ["编码", "终端", "命令行", "cli", "tui", "编程", "写代码", "coding", "terminal", "code", "代码"],
    "桌面端": ["桌面", "桌面端", "gui", "客户端", "desktop", "桌面应用", "图形界面"],
    "搜索": ["搜索", "联网", "网络搜索", "查资料", "检索", "search", "web", "谷歌", "百度", "研究", "research", "找资料", "上网"],
    "浏览器": ["浏览器", "browser", "浏览器自动化", "操控浏览器", "网页", "chrome", "登录态"],
    "文件": ["文件", "文件管理", "文件浏览", "文件系统", "虚拟文件系统", "file", "文件管理器", "目录"],
    "设计": ["设计", "ui", "原型", "界面设计", "落地页", "ppt", "设计稿", "design", "prototype", "美观", "前端", "海报"],
    "图表": ["图表", "架构图", "流程图", "时序图", "diagram", "可视化", "数据流图", "示意图"],
    "视频": ["视频", "视频生成", "视频制作", "video", "短视频", "影片", "解说视频"],
    "图像": ["图像生成", "图片生成", "文生图", "生成图片", "绘画", "提示词", "image generation", "生成图", "画图"],
    "技能": ["技能", "技能库", "技能管理", "skill", "技能编排", "技能路由", "能力包"],
    "任务": ["任务", "看板", "任务管理", "task", "工作流", "待办", "进度", "任务看板"],
    "多代理": ["多代理", "多agent", "子代理", "团队协作", "multi-agent", "多智能体", "派发", "多个agent"],
    "侧边栏": ["侧边栏", "sidebar", "面板", "批注", "git面板", "终端面板", "边栏"],
    "皮肤": ["皮肤", "主题", "壁纸", "换肤", "theme", "skin", "外观", "美化", "颜值", "好看"],
    "多模型": ["多模型", "模型切换", "模型管理", "供应商", "provider", "网关", "模型", "切换模型", "订阅"],
    "通讯": ["通讯", "im", "飞书", "微信", "钉钉", "qq", "slack", "telegram", "机器人", "消息", "discord", "whatsapp"],
    "后端": ["后端", "云", "数据库", "云函数", "backend", "cloud", "database", "认证", "数据", "存储"],
    "安全": ["安全", "审计", "防护", "防注入", "security", "渗透", "恶意", "密钥", "防护", "杀毒"],
    "市场": ["市场", "安装", "插件市场", "管理插件", "marketplace", "安装管理", "发现插件", "安装插件", "装插件"],
    "移动端": ["移动", "手机", "移动端", "mobile", "远程", "扫码", "掌上", "口袋"],
    "桌宠": ["桌宠", "桌面宠物", "宠物", "pet", "陪伴", "伙伴", "动物", "养成"],
    "趣味": ["趣味", "恶搞", "娱乐", "fun", "门户", "整活", "好玩"],
    "教程": ["教程", "文档", "手册", "学习", "入门", "tutorial", "guide", "指南", "资料", "从零"],
  };

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
    if (state.fav && window.__DSH_FAV__ && !window.__DSH_FAV__.has(p.id)) return false;
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
      cards += "<a class=\"must-card\" href=\"plugin/" + encodeURIComponent(p.id) + ".html\">"
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
    var detailUrl = "plugin/" + encodeURIComponent(p.id) + ".html";
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
      + "<button class=\"fav-btn\" data-fav=\"" + esc(p.id) + "\" title=\"收藏\">" + (window.__DSH_FAV__ && window.__DSH_FAV__.has(p.id) ? "⭐" : "☆") + "</button>"
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

  function aiMatch(query) {
    var q = (query || "").toLowerCase();
    if (!q) return { tags: [], results: [] };
    var tagHits = {};
    Object.keys(AI_ALIASES).forEach(function (tag) {
      AI_ALIASES[tag].forEach(function (alias) {
        if (q.indexOf(alias.toLowerCase()) >= 0) tagHits[tag] = (tagHits[tag] || 0) + 1;
      });
    });
    var scored = plugins.map(function (p) {
      var score = 0;
      (p.tags || []).forEach(function (t) { if (tagHits[t]) score += tagHits[t] * 5; });
      var hay = (p.name + " " + p.description + " " + p.summary).toLowerCase();
      if (hay.indexOf(q) >= 0) score += 2;
      return { p: p, score: score };
    });
    var top = scored.filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score || (b.p.stars + b.p.matchScore) - (a.p.stars + a.p.matchScore); })
      .slice(0, 6);
    return { tags: Object.keys(tagHits), results: top };
  }

  function renderAI() {
    var box = document.getElementById("ai-result");
    var tagBox = document.getElementById("ai-tags");
    var q = state.aiQuery;
    if (!q) { tagBox.innerHTML = ""; box.innerHTML = ""; return; }
    var res = aiMatch(q);
    if (!res.tags.length && !res.results.length) {
      tagBox.innerHTML = "";
      box.innerHTML = '<div class="ai-empty">🤔 没识别到明确需求，换个说法试试，例如「看图」「长期记忆」「联网搜索」</div>';
      return;
    }
    var tagHtml = "";
    res.tags.forEach(function (t) { tagHtml += '<span class="chip">' + esc(t) + '</span>'; });
    tagBox.innerHTML = tagHtml ? '<span class="ai-label">识别到的能力：</span>' + tagHtml : "";
    if (!res.results.length) {
      box.innerHTML = '<div class="ai-empty">没有完全匹配的插件，试试其他关键词</div>';
      return;
    }
    var cards = "";
    res.results.forEach(function (r) { cards += cardHtml(r.p); });
    box.innerHTML = '<div class="ai-summary">为你推荐 ' + res.results.length + ' 个插件（按能力匹配 + star 排序）</div><div class="list">' + cards + '</div>';
    semanticUpgrade(q);
  }

  async function semanticUpgrade(q) {
    if (!window.__SEMANTIC__) return;
    var sem = await window.__SEMANTIC__.match(q);
    if (!sem || !sem.length) return;
    var box = document.getElementById("ai-result");
    var tagBox = document.getElementById("ai-tags");
    var cards = "";
    sem.forEach(function (r) { cards += cardHtml(r.p); });
    tagBox.innerHTML = '<span class="ai-label">🤖 语义匹配：</span>';
    box.innerHTML = '<div class="ai-summary">语义推荐 ' + sem.length + ' 个插件（AI 相似度）</div><div class="list">' + cards + '</div>';
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

  function updateFavToggle() {
    var btn = document.getElementById("fav-toggle");
    if (!btn) return;
    var n = window.__DSH_FAV__ ? window.__DSH_FAV__.count() : 0;
    btn.textContent = (state.fav ? "⭐ 只看收藏" : "⭐ 收藏") + (n ? " (" + n + ")" : "");
    if (state.fav) btn.classList.add("active"); else btn.classList.remove("active");
  }

  function render() {
    renderHero();
    renderMustInstall();
    renderCategories();
    renderPanel();
    renderList();
    renderFooter();
    updateFavToggle();
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
    document.getElementById("fav-toggle").addEventListener("click", function () {
      state.fav = !state.fav;
      updateFavToggle();
      renderList();
    });
    document.getElementById("ai-go").addEventListener("click", function () {
      state.aiQuery = document.getElementById("ai-query").value.trim();
      try { localStorage.setItem("dsh-ai-query", state.aiQuery); } catch (e) {}
      renderAI();
    });
    document.getElementById("ai-query").addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        state.aiQuery = e.target.value.trim();
        try { localStorage.setItem("dsh-ai-query", state.aiQuery); } catch (e) {}
        renderAI();
      }
    });
    document.getElementById("ai-clear").addEventListener("click", function () {
      state.aiQuery = "";
      document.getElementById("ai-query").value = "";
      try { localStorage.removeItem("dsh-ai-query"); } catch (e) {}
      renderAI();
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
      var favBtn = e.target.closest("[data-fav]");
      if (favBtn) {
        var fid = favBtn.getAttribute("data-fav");
        if (window.__DSH_FAV__) {
          var favOn = window.__DSH_FAV__.toggle(fid);
          favBtn.textContent = favOn ? "⭐" : "☆";
        }
        renderList();
        updateFavToggle();
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
  // 恢复上次的智能选型查询（从详情页返回后保留）
  try {
    var savedAI = localStorage.getItem("dsh-ai-query");
    if (savedAI) {
      state.aiQuery = savedAI;
      var aiEl = document.getElementById("ai-query");
      if (aiEl) aiEl.value = savedAI;
      renderAI();
    }
  } catch (err2) {}
  render();
})();
