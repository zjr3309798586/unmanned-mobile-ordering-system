document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var body = document.body;
  var unitPrice = Number(body.dataset.unitPrice || 13.9);

  var qtyNum = document.querySelector("[data-qty-num]");
  var priceIntNode = document.querySelector("[data-pr-int]");
  var specSummary = document.querySelector("[data-spec-summary]");
  var addCartBtn = document.querySelector("[data-add-cart]");
  var nameNode = document.querySelector(".d-name");
  var descNode = document.querySelector(".d-desc");
  var heroImg = document.querySelector(".d-hero-img");

  var qty = 1;

  /* ===== 按 ?id= 拉真实商品 ===== */
  var productId = app && app.queryParam ? app.queryParam("id") : null;
  if (productId && app && app.get) {
    app.get("/products/" + encodeURIComponent(productId))
      .then(function (p) {
        if (!p) return;
        if (nameNode) nameNode.textContent = p.name;
        if (descNode && p.description) descNode.textContent = p.description;
        if (heroImg && p.image) heroImg.src = app.imageUrl(p.image);
        unitPrice = Number(p.price || unitPrice);
        // 同步规格按钮里的价格(单规格"中¥X")
        var sizeBtn = document.querySelector('[data-opt-group="size"] .d-opt-btn');
        if (sizeBtn) sizeBtn.textContent = "中¥" + Math.round(unitPrice);
        document.title = p.name + " - 云豹小点";
        updateUI();
      })
      .catch(function () {});
  }

  /* ===== 选项切换 ===== */
  document.querySelectorAll("[data-opt-group]").forEach(function (group) {
    group.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-opt]");
      if (!btn) return;
      group.querySelectorAll("[data-opt]").forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      updateUI();
    });
  });

  /* ===== 数量加减 ===== */
  var minus = document.querySelector("[data-qty-minus]");
  var plus = document.querySelector("[data-qty-plus]");
  if (minus) minus.addEventListener("click", function () { if (qty > 1) { qty--; updateUI(); } });
  if (plus) plus.addEventListener("click", function () { qty++; updateUI(); });

  /* ===== UI 同步 ===== */
  function collectSpec() {
    var parts = [];
    var spec = {};
    document.querySelectorAll("[data-opt-group]").forEach(function (group) {
      var key = group.dataset.optGroup;
      var name = group.dataset.optName;
      var sel = group.querySelector("[data-opt].is-active");
      if (sel) {
        var v = sel.dataset.opt;
        spec[key] = v;
        // 摘要只取规格相关(去掉"¥17"价格部分)
        var summaryVal = v.replace(/¥\d+(\.\d+)?/, "").trim();
        if (summaryVal) parts.push(summaryVal);
        else parts.push(v);
      }
    });
    return { spec: spec, summary: parts.join("/") };
  }

  function updateUI() {
    if (qtyNum) qtyNum.textContent = String(qty);
    var total = unitPrice * qty;
    if (priceIntNode) priceIntNode.textContent = total.toFixed(1);
    var s = collectSpec();
    if (specSummary) specSummary.textContent = s.summary;
  }

  /* ===== 加入购物车 ===== */
  if (addCartBtn) {
    addCartBtn.addEventListener("click", function () {
      var s = collectSpec();
      if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
        // 未登录走 devLogin 兜底
        var doAdd = function () { realAdd(s); };
        if (app && app.devLogin) app.devLogin("游客用户").then(doAdd).catch(function () { if (app.showMessage) app.showMessage("登录失败"); });
        else if (app && app.showMessage) app.showMessage("请先登录");
        return;
      }
      realAdd(s);
    });
  }

  function realAdd(s) {
    addCartBtn.disabled = true;
    var pid = (app.queryParam ? (app.queryParam("id") || "P-1001") : "P-1001");
    app.post("/cart/items", { productId: pid, spec: s.summary, quantity: qty })
      .then(function () {
        if (app.showMessage) app.showMessage("已加入购物车");
        window.setTimeout(function () { window.location.href = "cart.html"; }, 350);
      })
      .catch(function (e) {
        if (app.showMessage) app.showMessage(e.message);
      })
      .finally(function () { addCartBtn.disabled = false; });
  }

  /* ===== 口味收藏 ===== */
  var favBtn = document.querySelector("[data-fav-btn]");
  var favIcon = document.querySelector("[data-fav-icon]");
  var FAV_KEY = "orderingFavorites";

  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveFavs(list) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function syncFavUI() {
    if (!favBtn || !productId) return;
    var favs = getFavs();
    var on = favs.indexOf(productId) >= 0;
    favBtn.classList.toggle("is-active", on);
    if (favIcon) favIcon.textContent = on ? "★" : "☆";
  }
  if (favBtn) {
    favBtn.addEventListener("click", function () {
      if (!productId) return;
      var favs = getFavs();
      var i = favs.indexOf(productId);
      if (i >= 0) { favs.splice(i, 1); if (app.showMessage) app.showMessage("已取消收藏"); }
      else { favs.push(productId); if (app.showMessage) app.showMessage("已加入口味收藏"); }
      saveFavs(favs);
      syncFavUI();
    });
  }
  syncFavUI();

  updateUI();
});
