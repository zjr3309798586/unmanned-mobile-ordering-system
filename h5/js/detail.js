/**
 * 商品详情页交互。
 *
 * 五大块:
 *   1. 按 URL ?id= 拉商品数据填充页面(图/名/描述/价格)
 *   2. 规格选项切换(规格/温度/糖度/甜度,单选高亮)
 *   3. 数量加减(底部 - / + 按钮)
 *   4. 加入购物车(未登录自动走 devLogin 兜底,加完跳购物车页)
 *   5. 口味收藏(★ / ☆,纯前端 localStorage,不调后端)
 */
document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var body = document.body;
  // 单价兜底:dataset.unitPrice 是 html 里写的默认值(13.9),后端接口返回后会覆盖
  var unitPrice = Number(body.dataset.unitPrice || 13.9);

  // 抓 DOM
  var qtyNum = document.querySelector("[data-qty-num]");
  var priceIntNode = document.querySelector("[data-pr-int]");
  var specSummary = document.querySelector("[data-spec-summary]");
  var addCartBtn = document.querySelector("[data-add-cart]");
  var nameNode = document.querySelector(".d-name");
  var descNode = document.querySelector(".d-desc");
  var heroImg = document.querySelector(".d-hero-img");

  var qty = 1;   // 用户选的数量

  // ===== 按 ?id= 拉真实商品 =====
  // 没有 id 时(直接打开 detail.html 调试)就用 html 里写死的占位数据
  var productId = app && app.queryParam ? app.queryParam("id") : null;
  if (productId && app && app.get) {
    app.get("/products/" + encodeURIComponent(productId))
      .then(function (p) {
        if (!p) return;
        // 填充商品基础信息
        if (nameNode) nameNode.textContent = p.name;
        if (descNode && p.description) descNode.textContent = p.description;
        if (heroImg && p.image) heroImg.src = app.imageUrl(p.image);
        unitPrice = Number(p.price || unitPrice);
        // 同步规格按钮里的价格(单规格"中¥X")
        var sizeBtn = document.querySelector('[data-opt-group="size"] .d-opt-btn');
        if (sizeBtn) sizeBtn.textContent = "中¥" + Math.round(unitPrice);
        // 同步浏览器标题为商品名,分享时看着更清楚
        document.title = p.name + " - 云豹小点";
        updateUI();
      })
      .catch(function () {});   // 失败时不弹错,保持页面占位状态
  }

  // ===== 选项切换(规格/温度/糖度/甜度)=====
  // 同一组内点击 → 当前激活,其他取消;事件委托到 group 上一次绑定
  document.querySelectorAll("[data-opt-group]").forEach(function (group) {
    group.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-opt]");
      if (!btn) return;
      group.querySelectorAll("[data-opt]").forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      updateUI();   // 选择变化会影响摘要文案
    });
  });

  // ===== 数量加减 =====
  var minus = document.querySelector("[data-qty-minus]");
  var plus = document.querySelector("[data-qty-plus]");
  // 最少 1 件,不让减到 0
  if (minus) minus.addEventListener("click", function () { if (qty > 1) { qty--; updateUI(); } });
  if (plus) plus.addEventListener("click", function () { qty++; updateUI(); });

  // ===== UI 同步 =====

  /**
   * 收集 4 组选项的当前选中值,组装成 spec 对象 + 摘要字符串。
   * spec 用于发给后端(结构化);summary 是给用户看的拼接字符串(中/温/默认糖/七分甜)。
   */
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
        // 摘要文案要去掉"¥17"价格部分,只保留规格本身
        var summaryVal = v.replace(/¥\d+(\.\d+)?/, "").trim();
        if (summaryVal) parts.push(summaryVal);
        else parts.push(v);
      }
    });
    return { spec: spec, summary: parts.join("/") };
  }

  /** 任何状态变化(数量改变 / 选项切换)都调一次,刷新数量显示 + 总价 + 摘要。 */
  function updateUI() {
    if (qtyNum) qtyNum.textContent = String(qty);
    var total = unitPrice * qty;
    if (priceIntNode) priceIntNode.textContent = total.toFixed(1);
    var s = collectSpec();
    if (specSummary) specSummary.textContent = s.summary;
  }

  // ===== 加入购物车 =====
  if (addCartBtn) {
    addCartBtn.addEventListener("click", function () {
      var s = collectSpec();
      // 未登录:尝试自动 devLogin 一下再加购(开发模式专用,
      // 真实场景这里应该跳登录页或弹微信登录)
      if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
        var doAdd = function () { realAdd(s); };
        if (app && app.devLogin) app.devLogin("游客用户").then(doAdd).catch(function () { if (app.showMessage) app.showMessage("登录失败"); });
        else if (app && app.showMessage) app.showMessage("请先登录");
        return;
      }
      realAdd(s);
    });
  }

  /** 真实的加购请求 —— 上传 productId / spec / quantity 到后端,成功后跳购物车。 */
  function realAdd(s) {
    addCartBtn.disabled = true;   // 防止用户在请求中重复点击
    // pid 兜底:URL 没 id 时给一个默认商品 P-1001(开发时方便)
    var pid = (app.queryParam ? (app.queryParam("id") || "P-1001") : "P-1001");
    app.post("/cart/items", { productId: pid, spec: s.summary, quantity: qty })
      .then(function () {
        if (app.showMessage) app.showMessage("已加入购物车");
        // 350ms 后跳购物车页(给 toast 留时间)
        window.setTimeout(function () { window.location.href = "cart.html"; }, 350);
      })
      .catch(function (e) {
        if (app.showMessage) app.showMessage(e.message);
      })
      .finally(function () { addCartBtn.disabled = false; });
  }

  // ===== 口味收藏 =====
  // 纯前端实现:收藏的商品 id 存 localStorage["orderingFavorites"],不调后端
  // ★ 表示已收藏,☆ 表示未收藏
  var favBtn = document.querySelector("[data-fav-btn]");
  var favIcon = document.querySelector("[data-fav-icon]");
  var FAV_KEY = "orderingFavorites";

  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveFavs(list) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) {}
  }
  /** 根据本地收藏列表刷新按钮的高亮状态和图标。 */
  function syncFavUI() {
    if (!favBtn || !productId) return;
    var favs = getFavs();
    var on = favs.indexOf(productId) >= 0;
    favBtn.classList.toggle("is-active", on);
    if (favIcon) favIcon.textContent = on ? "★" : "☆";
  }
  if (favBtn) {
    favBtn.addEventListener("click", function () {
      if (!productId) return;   // 没 productId 没办法收藏
      var favs = getFavs();
      var i = favs.indexOf(productId);
      // toggle:已在列表里就移除,不在就加入
      if (i >= 0) { favs.splice(i, 1); if (app.showMessage) app.showMessage("已取消收藏"); }
      else { favs.push(productId); if (app.showMessage) app.showMessage("已加入口味收藏"); }
      saveFavs(favs);
      syncFavUI();
    });
  }
  syncFavUI();

  updateUI();   // 初始化时跑一次,把默认状态写到页面
});
