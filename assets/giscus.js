(function () {
  "use strict";
  // ===== Giscus 配置（把 repoId / categoryId 填好，评论功能即生效）=====
  var CONFIG = {
    repo: "carrojer0011/dsh-plugin-hub",
    repoId: "",                 // ← 填这里（giscus.app 会给你）
    category: "General",        // 讨论分类名，可改成你想要的
    categoryId: "",             // ← 填这里（giscus.app 会给你）
    term: window.__PLUGIN_ID__ || "index",
    theme: "preferred_color_scheme",
    lang: "zh-CN"
  };

  if (!CONFIG.repoId || !CONFIG.categoryId) return; // 未配置，不加载

  var host = document.querySelector("[data-giscus]");
  if (!host) return;

  var s = document.createElement("script");
  s.src = "https://giscus.app/client.js";
  s.setAttribute("data-repo", CONFIG.repo);
  s.setAttribute("data-repo-id", CONFIG.repoId);
  s.setAttribute("data-category", CONFIG.category);
  s.setAttribute("data-category-id", CONFIG.categoryId);
  s.setAttribute("data-mapping", "specific");
  s.setAttribute("data-term", CONFIG.term);
  s.setAttribute("data-strict", "0");
  s.setAttribute("data-reactions-enabled", "1");
  s.setAttribute("data-emit-metadata", "0");
  s.setAttribute("data-input-position", "bottom");
  s.setAttribute("data-theme", CONFIG.theme);
  s.setAttribute("data-lang", CONFIG.lang);
  s.setAttribute("crossorigin", "anonymous");
  s.async = true;
  host.appendChild(s);
})();
