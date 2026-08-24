(function () {
  "use strict";
  var KEY = "dsh-theme";
  var theme = "light";
  try { theme = localStorage.getItem(KEY) || "light"; } catch (e) {}

  function syncButtons() {
    var btns = document.querySelectorAll(".theme-toggle");
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = theme === "dark" ? "☀️" : "🌙";
      btns[i].title = theme === "dark" ? "切换浅色" : "切换深色";
    }
  }
  function apply() {
    document.documentElement.setAttribute("data-theme", theme);
    syncButtons();
  }

  apply();
  document.addEventListener("DOMContentLoaded", syncButtons);
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".theme-toggle");
    if (!b) return;
    theme = theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    apply();
  });
})();
