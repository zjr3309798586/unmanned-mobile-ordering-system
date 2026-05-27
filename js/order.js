document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var listBox = document.querySelector("[data-order-list]");
  var emptyNode = document.querySelector("[data-order-empty]");

  function setEmpty(html) {
    if (listBox) listBox.innerHTML = '<p class="order-empty">' + html + '</p>';
  }

  function escape(v) { return app && app.escapeHtml ? app.escapeHtml(v == null ? "" : v) : String(v || ""); }

  function statusText(s) {
    return ({
      WAITING_PICKUP: "待取餐",
      COMPLETED: "已完成",
      CANCELED: "已取消"
    })[s] || s || "未知";
  }

  function formatTime(t) {
    return String(t || "").replace("T", " ").slice(0, 19);
  }

  function render(orders) {
    if (!listBox) return;
    if (!orders || orders.length === 0) {
      setEmpty('暂无订单<br><a class="order-empty-btn" href="menu.html">去点餐</a>');
      return;
    }
    listBox.innerHTML = orders.map(function (o) {
      var items = o.items || [];
      var qty = items.reduce(function (s, it) { return s + Number(it.quantity || 1); }, 0);
      var thumbs = items.slice(0, 3).map(function (it) {
        var img = it.image ? (app.imageUrl ? app.imageUrl(it.image) : it.image) : "images/menu-product-milk-tea.png";
        return '<span class="oc-thumb"><img src="' + img + '" onerror="this.src=\'images/food-placeholder.svg\'"></span>';
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

  if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
    setEmpty('登录后查看订单<br><a class="order-empty-btn" href="mine.html">去登录</a>');
    return;
  }

  app.get("/orders")
    .then(function (orders) { render(orders); })
    .catch(function (e) {
      setEmpty('加载失败:' + (e && e.message || "未知错误"));
    });

  if (listBox) {
    listBox.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-order-action='repeat']");
      if (!btn) return;
      var id = btn.dataset.orderId;
      btn.disabled = true;
      app.post("/orders/" + encodeURIComponent(id) + "/repeat", {})
        .then(function () {
          if (app.showMessage) app.showMessage("已加入购物车");
          window.setTimeout(function () { window.location.href = "cart.html"; }, 400);
        })
        .catch(function (err) {
          if (app.showMessage) app.showMessage(err.message);
          btn.disabled = false;
        });
    });
  }
});
