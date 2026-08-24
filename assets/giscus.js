(function () {
  "use strict";
  var CONFIG = {
    repo: "carrojer0011/dsh-plugin-hub",
    repoId: "R_kgDOUCLRxw",
    category: "Announcements",
    categoryId: "DIC_kwDOUCLRx84DEEBT",
    mapping: "pathname",
    theme: "gruvbox_light",
    lang: "zh-CN",
    inputPosition: "top",
    loading: "lazy"
  };

  var host = document.querySelector("[data-giscus]");
  if (!host) return;

  var s = document.createElement("script");
  s.src = "https://giscus.app/client.js";
  s.setAttribute("data-repo", CONFIG.repo);
  s.setAttribute("data-repo-id", CONFIG.repoId);
  s.setAttribute("data-category", CONFIG.category);
  s.setAttribute("data-category-id", CONFIG.categoryId);
  s.setAttribute("data-mapping", CONFIG.mapping);
  s.setAttribute("data-strict", "0");
  s.setAttribute("data-reactions-enabled", "1");
  s.setAttribute("data-emit-metadata", "0");
  s.setAttribute("data-input-position", CONFIG.inputPosition);
  s.setAttribute("data-theme", CONFIG.theme);
  s.setAttribute("data-lang", CONFIG.lang);
  s.setAttribute("data-loading", CONFIG.loading);
  s.setAttribute("crossorigin", "anonymous");
  s.async = true;
  host.appendChild(s);
})();
