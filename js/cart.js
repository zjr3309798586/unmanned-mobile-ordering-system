document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var goodsTotalNode = document.querySelector("[data-goods-total]");
  var packagingNode = document.querySelector("[data-packaging-fee]");
  var discountNode = document.querySelector("[data-discount-total]");
  var payNode = document.querySelector("[data-pay-total]");
  var barPayNode = document.querySelector("[data-bar-pay-total]");
  var barCountNode = document.querySelector("[data-bar-item-count]");
  var emptyNode = document.querySelector("[data-cart-empty]");
  var listNode = document.querySelector("[data-cart-list]");
  var checkoutBar = document.querySelector(".checkout-bar");
  var storeNameNode = document.querySelector(".store-name");
  var storeAddressNode = document.querySelector(".store-address");
  var tipTextNode = document.querySelector("[data-cart-tip-text]");

  function renderStore(store) {
    if (!store) {
      return;
    }
    if (storeNameNode) {
      storeNameNode.textContent = store.name;
    }
    if (storeAddressNode) {
      storeAddressNode.textContent = "已选商品将保存在 " + store.name + " 购物车中，可直接跳转提交订单页。";
    }
  }

  function renderCouponTip(coupons) {
    if (!tipTextNode) {
      return;
    }
    var coupon = (coupons || []).find(function (item) {
      return item.available;
    });
    tipTextNode.textContent = coupon
      ? coupon.conditionText + "，提交订单时可减 " + app.money(coupon.discountAmount) + "。"
      : "当前暂无可用优惠券，提交订单时按商品金额结算。";
  }

  function renderCart(summary) {
    var data = summary || { items: [], totalAmount: 0, totalQuantity: 0 };
    var items = data.items || [];

    if (listNode) {
      listNode.innerHTML = items.map(renderCartItem).join("");
      listNode.style.display = items.length === 0 ? "none" : "flex";
    }
    if (emptyNode) {
      emptyNode.style.display = items.length === 0 ? "block" : "none";
    }
    if (checkoutBar) {
      checkoutBar.style.display = items.length === 0 ? "none" : "flex";
    }

    if (goodsTotalNode) {
      goodsTotalNode.textContent = app.money(data.totalAmount);
    }
    if (packagingNode) {
      packagingNode.textContent = app.money(0);
    }
    if (discountNode) {
      discountNode.textContent = "- " + app.money(0);
    }
    if (payNode) {
      payNode.textContent = app.money(data.totalAmount);
    }
    if (barPayNode) {
      barPayNode.textContent = app.money(data.totalAmount);
    }
    if (barCountNode) {
      barCountNode.textContent = String(data.totalQuantity || 0);
    }
  }

  function renderCartItem(item) {
    return '<article class="cart-item" data-cart-item data-item-id="' + app.escapeHtml(item.id) + '" data-qty="' + item.quantity + '">' +
      '<img class="cover-thumb" src="' + app.imageUrl(item.image) + '" alt="' + app.escapeHtml(item.productName) + '" onerror="this.src=\'images/food-placeholder.svg\'">' +
      '<div class="cart-item-main">' +
        '<div class="cart-item-head">' +
          '<div><h3 class="product-name">' + app.escapeHtml(item.productName) + '</h3><p class="product-desc">' + app.escapeHtml(app.specText(item.spec)) + '</p></div>' +
          '<button class="text-action" type="button" data-delete-item>删除</button>' +
        '</div>' +
        '<div class="price-line">' +
          '<strong class="price small-price">' + app.money(item.subtotal || Number(item.price) * item.quantity) + '</strong>' +
          '<div class="stepper"><button type="button" data-cart-minus>-</button><span data-cart-qty>' + item.quantity + '</span><button type="button" data-cart-plus>+</button></div>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function loadCart() {
    if (!app.isLoggedIn()) {
      if (listNode) {
        listNode.style.display = "none";
      }
      if (emptyNode) {
        emptyNode.style.display = "block";
        emptyNode.innerHTML = '<div class="empty-state">' +
          '<strong>请先登录</strong>' +
          '<p>登录后购物车会按你的账号保存，之后可继续提交订单。</p>' +
          '<a class="button button-primary" href="mine.html">去登录</a>' +
        '</div>';
      }
      if (checkoutBar) {
        checkoutBar.style.display = "none";
      }
      renderCart({ items: [], totalAmount: 0, totalQuantity: 0 });
      return;
    }
    if (listNode) {
      listNode.innerHTML = '<p class="section-note">正在读取购物车...</p>';
    }
    Promise.all([app.get("/store"), app.get("/cart"), app.get("/coupons")]).then(function (result) {
      renderStore(result[0]);
      renderCart(result[1]);
      renderCouponTip(result[2]);
    }).catch(function (error) {
      app.showMessage(error.message);
    });
  }

  document.addEventListener("click", function (event) {
    var item = event.target.closest("[data-cart-item]");
    if (!item) {
      return;
    }
    var itemId = item.dataset.itemId;
    var qty = parseInt(item.dataset.qty || "1", 10);

    if (event.target.closest("[data-cart-minus]") && qty > 1) {
      app.patch("/cart/items/" + encodeURIComponent(itemId), { quantity: qty - 1 })
        .then(renderCart)
        .catch(function (error) { app.showMessage(error.message); });
    }

    if (event.target.closest("[data-cart-plus]")) {
      app.patch("/cart/items/" + encodeURIComponent(itemId), { quantity: qty + 1 })
        .then(renderCart)
        .catch(function (error) { app.showMessage(error.message); });
    }

    if (event.target.closest("[data-delete-item]")) {
      app.del("/cart/items/" + encodeURIComponent(itemId))
        .then(renderCart)
        .catch(function (error) { app.showMessage(error.message); });
    }
  });

  loadCart();
});
