document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var tabs = document.querySelectorAll("[data-order-filter]");
  var orderList = document.querySelector(".order-list");
  var activeFilter = "all";

  function orderType(order) {
    return order.status === "WAITING_PICKUP" ? "current" : "history";
  }

  function renderOrders(orders) {
    if (!orderList) {
      return;
    }
    var visible = (orders || []).filter(function (order) {
      return activeFilter === "all" || orderType(order) === activeFilter;
    });

    if (visible.length === 0) {
      orderList.innerHTML = '<section class="section-card"><p class="section-note">暂无订单数据。</p></section>';
      return;
    }

    orderList.innerHTML = visible.map(renderOrderCard).join("");
  }

  function renderOrderCard(order) {
    var goods = (order.items || []).map(function (item) {
      return '<p>' + app.escapeHtml(item.productName) + ' × ' + item.quantity + ' · ' + app.escapeHtml(item.spec || "Regular") + '</p>';
    }).join("");
    var statusClass = order.status === "WAITING_PICKUP" ? " is-open" : "";
    var actions = order.status === "WAITING_PICKUP"
      ? '<button class="button button-secondary" type="button" data-order-action="cancel" data-order-id="' + app.escapeHtml(order.id) + '">取消订单</button>'
      : "";
    actions += '<button class="button button-primary" type="button" data-order-action="repeat" data-order-id="' + app.escapeHtml(order.id) + '">再来一单</button>';

    return '<article class="section-card order-card" data-order-type="' + orderType(order) + '">' +
      '<div class="order-card-head">' +
        '<div><h2 class="section-title">' + app.escapeHtml(order.storeName) + '</h2><p class="section-note">订单号：' + app.escapeHtml(order.orderNo) + ' · ' + app.escapeHtml(formatTime(order.createdAt)) + '</p></div>' +
        '<span class="status-pill' + statusClass + '">' + app.statusText(order.status) + '</span>' +
      '</div>' +
      '<div class="order-goods">' + goods + '</div>' +
      '<div class="summary-row total-row"><span>实付金额</span><strong class="accent-price">' + app.money(order.payableAmount) + '</strong></div>' +
      '<div class="action-row">' + actions + '</div>' +
    '</article>';
  }

  function formatTime(value) {
    if (!value) {
      return "";
    }
    return String(value).replace("T", " ").slice(0, 16);
  }

  function loadOrders() {
    if (orderList) {
      orderList.innerHTML = '<section class="section-card"><p class="section-note">正在读取订单...</p></section>';
    }
    app.get("/orders").then(renderOrders).catch(function (error) {
      if (orderList) {
        orderList.innerHTML = '<section class="section-card"><p class="section-note">订单接口连接失败：' + app.escapeHtml(error.message) + '</p></section>';
      }
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      activeFilter = tab.dataset.orderFilter;
      tabs.forEach(function (item) {
        item.classList.remove("is-active");
      });
      tab.classList.add("is-active");
      loadOrders();
    });
  });

  if (orderList) {
    orderList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-order-action]");
      if (!button) {
        return;
      }
      var orderId = button.dataset.orderId;
      if (button.dataset.orderAction === "cancel") {
        app.patch("/orders/" + encodeURIComponent(orderId) + "/cancel", {})
          .then(function () {
            app.showMessage("订单已取消");
            loadOrders();
          })
          .catch(function (error) { app.showMessage(error.message); });
      }
      if (button.dataset.orderAction === "repeat") {
        app.post("/orders/" + encodeURIComponent(orderId) + "/repeat", {})
          .then(function () {
            app.showMessage("已加入购物车");
            window.setTimeout(function () {
              window.location.href = "cart.html";
            }, 500);
          })
          .catch(function (error) { app.showMessage(error.message); });
      }
    });
  }

  loadOrders();
});
