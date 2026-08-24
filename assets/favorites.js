(function () {
  "use strict";
  var KEY = "dsh-fav";
  var list = [];
  try { list = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { list = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }
  function has(id) { return list.indexOf(id) >= 0; }
  function toggle(id) {
    var i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.push(id);
    save();
    return has(id);
  }
  window.__DSH_FAV__ = {
    has: has,
    toggle: toggle,
    count: function () { return list.length; },
    list: function () { return list.slice(); }
  };
})();
