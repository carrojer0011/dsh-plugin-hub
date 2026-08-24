(function () {
  "use strict";
  var MODEL = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
  var CDN = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.1";
  var CACHE_KEY = "dsh-emb-v1";
  var ready = false, failed = false;
  var extractor = null, embeddings = null, loadPromise = null;

  function pluginText(p) {
    return p.name + " " + p.description + " " + p.summary + " " + (p.tags || []).join(" ");
  }
  function cosine(a, b) {
    var dot = 0, na = 0, nb = 0;
    for (var i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
    if (!na || !nb) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }
  async function embed(text) {
    var out = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(out.data);
  }
  function load() {
    if (ready) return Promise.resolve(true);
    if (failed) return Promise.resolve(false);
    if (!loadPromise) {
      loadPromise = (async function () {
        try {
          var mod = await import(CDN);
          extractor = await mod.pipeline("feature-extraction", MODEL);
          embeddings = await buildEmbeddings();
          ready = true;
          return true;
        } catch (e) {
          failed = true;
          return false;
        }
      })();
    }
    return loadPromise;
  }
  async function buildEmbeddings() {
    try {
      var cached = localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    var embs = {};
    var plugins = (window.__DSH_PLUGIN_DATA__ || {}).plugins || [];
    for (var i = 0; i < plugins.length; i++) {
      var p = plugins[i];
      embs[p.id] = await embed(pluginText(p));
    }
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(embs)); } catch (e) {}
    return embs;
  }
  async function match(query) {
    var ok = await load();
    if (!ok) return null;
    var qv = await embed(query);
    var plugins = (window.__DSH_PLUGIN_DATA__ || {}).plugins || [];
    var scored = [];
    for (var i = 0; i < plugins.length; i++) {
      var p = plugins[i];
      var emb = embeddings[p.id];
      if (!emb) continue;
      scored.push({ p: p, sim: cosine(qv, emb) });
    }
    scored.sort(function (a, b) { return b.sim - a.sim; });
    var top = [];
    for (var j = 0; j < scored.length && top.length < 6; j++) {
      if (scored[j].sim > 0.30) top.push(scored[j]);
    }
    return top;
  }
  window.__SEMANTIC__ = {
    ready: function () { return ready; },
    match: match,
  };
})();
