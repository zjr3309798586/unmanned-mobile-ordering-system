/**
 * 订单页:展示当前用户的订单列表 + "再来一单"功能。
 *
 * 三种状态:
 *   1. 未登录 → 显示"登录后查看订单" + 去登录链接
 *   2. 已登录但无订单 → 显示"暂无订单" + 去点餐链接
 *   3. 已登录有订单 → 渲染订单卡片列表
 *
 * "再来一单"不是直接创建订单,而是把历史订单商品加入购物车,跳到结算页。
 */
document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var listBox = document.querySelector("[data-order-list]");
  var emptyNode = document.querySelector("[data-order-empty]");

  /** 空状态/错误状态都用同一个文案位置,把 listBox 内容替换成提示文案。 */
  function setEmpty(html) {
    if (listBox) listBox.innerHTML = '<p class="order-empty">' + html + '</p>';
  }

  /** XSS 转义兜底:即使 app 没加载也能安全工作。 */
  function escape(v) { return app && app.escapeHtml ? app.escapeHtml(v == null ? "" : v) : String(v || ""); }

  /** 订单状态英文 → 中文(本地版,不依赖 common.js)。 */
  function statusText(s) {
    return ({
      WAITING_PICKUP: "待取餐",
      COMPLETED: "已完成",
      CANCELED: "已取消"
    })[s] || s || "未知";
  }

  /** ISO 时间 "2026-05-27T15:30:00" → "2026-05-27 15:30:00",截掉毫秒。 */
  function formatTime(t) {
    return String(t || "").replace("T", " ").slice(0, 19);
  }

  /**
   * 渲染订单列表。
   * 每条订单生成一个 .order-card,包含:
   *   - 头部:门店名 + 状态徽章
   *   - 元信息:下单时间 + 取餐号
   *   - 商品缩略图(最多展示 3 张) + 总金额 + 件数
   *   - 底部:评价 + 再来一单 两个按钮
   */
  function render(orders) {
    if (!listBox) return;
    if (!orders || orders.length === 0) {
      setEmpty('暂无订单<br><a class="order-empty-btn" href="menu.html">去点餐</a>');
      return;
    }
    listBox.innerHTML = orders.map(function (o) {
      var items = o.items || [];
      // 总件数 = 所有明细 quantity 求和
      var qty = items.reduce(function (s, it) { return s + Number(it.quantity || 1); }, 0);
      // 缩略图:最多展示前 3 个明细的图,图加载失败时 onerror 兜底成占位图
      var thumbs = items.slice(0, 3).map(function (it) {
        var img = it.image ? (app.imageUrl ? app.imageUrl(it.image) : it.image) : "/images/menu/menu-product-milk-tea.png";
        return '<span class="oc-thumb"><img src="' + img + '" onerror="this.src=\'images/common/food-placeholder.svg\'"></span>';
      }).join("");
      return '<article class="order-card">'
        + '<header class="oc-head">'
        +   '<div class="oc-store"><h2 class="oc-store-name">' + escape(o.storeName || "云豹小点") + '</h2></div>'
        +   '<span class="oc-status"><span>' + statusText(o.status) + '</span></span>'
        + '</header>'
        + '<div class="oc-meta"><span>' + escape(formatTime(o.createdAt)) + '</span><span class="oc-meta-sep">|</span><span>取餐号 ' + escape(o.pickupNo || o.orderNo || "—") + '</span></div>'
        + '<div class="oc-body">'
        +   '<div class="oc-thumbs">' + thumbs + '</div>'
        +   '<div class="oc-price"><strong>¥' + Number(o.payableAmount || 0).toFixed(0) + '</strong><span>共' + qty + '件</span></div>'
        + '</div>'
        + '<div class="oc-actions">'
        +   '<button class="oc-btn oc-btn-outline" type="button">评价一下</button>'
        +   '<button class="oc-btn oc-btn-dark" type="button" data-order-action="repeat" data-order-id="' + escape(o.id) + '">再来一单</button>'
        + '</div>'
      + '</article>';
    }).join("");
  }

  // 状态 1:未登录,直接显示提示退出
  if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
    setEmpty('登录后查看订单<br><a class="order-empty-btn" href="mine.html">去登录</a>');
    return;
  }

  // 状态 2/3:已登录,拉订单列表
  app.get("/orders")
    .then(function (orders) { render(orders); })
    .catch(function (e) {
      setEmpty('加载失败:' + (e && e.message || "未知错误"));
    });

  // 事件委托:统一在 listBox 上监听点击,根据 data-order-action 分发
  // 这样动态生成的订单卡也能响应,不用每个卡片绑监听
  if (listBox) {
    listBox.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-order-action='repeat']");
      if (!btn) return;
      var id = btn.dataset.orderId;
      btn.disabled = true;   // 防止用户点击多次产生重复请求
      app.post("/orders/" + encodeURIComponent(id) + "/repeat", {})
        .then(function () {
          if (app.showMessage) app.showMessage("已加入购物车");
          // 400ms 后跳购物车页(让 toast 有时间显示)
          window.setTimeout(function () { window.location.href = "cart.html"; }, 400);
        })
        .catch(function (err) {
          if (app.showMessage) app.showMessage(err.message);
          btn.disabled = false;   // 恢复按钮,用户可以重试
        });
    });
  }
});
