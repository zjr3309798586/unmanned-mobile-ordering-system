document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var cartSummary = { items: [], totalAmount: 0, totalQuantity: 0 };
  var coupons = [];
  var selectedCouponId = "";
  var itemList = document.querySelector(".submit-item-list");
  var couponList = document.querySelector(".coupon-select-list");
  var goodsTotalNode = document.querySelector("[data-submit-goods-total]");
  var discountNode = document.querySelector("[data-submit-discount]");
  var payableNode = document.querySelector("[data-submit-payable]");
  var barPayableNode = document.querySelector("[data-submit-bar-payable]");
  var submitButton = document.querySelector(".submit-bar .button-primary");
  var tableInput = document.querySelector(".text-input");
  var remarkInput = document.querySelector(".text-area");
  var storeNameNode = document.querySelector("[data-submit-store-name]");
  var storeTextNode = document.querySelector("[data-submit-store-text]");

  function renderLoginRequired() {
    if (itemList) {
      itemList.innerHTML = '<div class="submit-item-row"><div><strong class="info-title">请先登录</strong><p class="info-text">登录后才能读取你的购物车并提交订单。</p></div><a class="section-link" href="mine.html">去登录</a></div>';
    }
    if (couponList) {
      couponList.innerHTML = '<button class="coupon-select is-active" type="button"><strong>登录后可查看优惠券</strong><span>当前不可选择</span></button>';
    }
    cartSummary = { items: [], totalAmount: 0, totalQuantity: 0 };
    renderAmount();
    if (submitButton) {
      submitButton.classList.add("button-secondary");
    }
  }

  function selectedDiscount() {
    var coupon = coupons.find(function (item) {
      return item.id === selectedCouponId;
    });
    return coupon ? Math.min(Number(coupon.discountAmount || 0), Number(cartSummary.totalAmount || 0)) : 0;
  }

  function renderStore(store) {
    if (!store) {
      return;
    }
    if (storeNameNode) {
      storeNameNode.textContent = store.name;
    }
    if (storeTextNode) {
      storeTextNode.textContent = store.address + "，预计 12 分钟出餐。";
    }
  }

  function renderItems() {
    if (!itemList) {
      return;
    }
    var items = cartSummary.items || [];
    if (items.length === 0) {
      itemList.innerHTML = '<div class="submit-item-row"><div><strong class="info-title">购物车为空</strong><p class="info-text">请先返回点餐页选择商品。</p></div></div>';
      return;
    }
    itemList.innerHTML = items.map(function (item) {
      return '<div class="submit-item-row">' +
        '<div><strong class="info-title">' + app.escapeHtml(item.productName) + ' × ' + item.quantity + '</strong><p class="info-text">' + app.escapeHtml(app.specText(item.spec)) + '</p></div>' +
        '<strong>' + app.money(item.subtotal || Number(item.price) * item.quantity) + '</strong>' +
      '</div>';
    }).join("");
  }

  function renderCoupons() {
    if (!couponList) {
      return;
    }
    var options = coupons.map(function (coupon) {
      var active = selectedCouponId === coupon.id ? " is-active" : "";
      return '<button class="coupon-select' + active + '" type="button" data-coupon-id="' + app.escapeHtml(coupon.id) + '">' +
        '<strong>' + app.escapeHtml(coupon.title) + '</strong><span>' + app.escapeHtml(coupon.conditionText) + '，减 ' + app.money(coupon.discountAmount) + '</span>' +
      '</button>';
    }).join("");
    if (coupons.length === 0) {
      couponList.innerHTML = '<button class="coupon-select is-active" type="button" data-coupon-id="">' +
        '<strong>暂无可用优惠券</strong><span>按商品金额结算</span></button>';
      return;
    }
    options += '<button class="coupon-select' + (!selectedCouponId ? " is-active" : "") + '" type="button" data-coupon-id="">' +
      '<strong>暂不使用</strong><span>保持原价</span></button>';
    couponList.innerHTML = options;
  }

  function renderAmount() {
    var discount = selectedDiscount();
    var payable = Math.max(Number(cartSummary.totalAmount || 0) - discount, 0);
    if (goodsTotalNode) {
      goodsTotalNode.textContent = app.money(cartSummary.totalAmount);
    }
    if (discountNode) {
      discountNode.textContent = "- " + app.money(discount);
    }
    if (payableNode) {
      payableNode.textContent = app.money(payable);
    }
    if (barPayableNode) {
      barPayableNode.textContent = app.money(payable);
    }
  }

  function renderAll() {
    renderItems();
    renderCoupons();
    renderAmount();
    if (submitButton) {
      submitButton.classList.toggle("button-secondary", !cartSummary.totalQuantity);
    }
  }

  if (couponList) {
    couponList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-coupon-id]");
      if (!button) {
        return;
      }
      selectedCouponId = button.dataset.couponId;
      renderCoupons();
      renderAmount();
    });
  }

  if (submitButton) {
    submitButton.addEventListener("click", function (event) {
      event.preventDefault();
      if (submitButton.getAttribute("aria-disabled") === "true") {
        return;
      }
      if (!cartSummary.totalQuantity) {
        app.showMessage("购物车为空，无法提交订单");
        return;
      }
      var choiceButtons = Array.from(document.querySelectorAll("[data-pickup-type]"));
      var activeChoice = choiceButtons.find(function (button) {
        return button.classList.contains("is-active");
      });
      submitButton.textContent = "提交中...";
      submitButton.setAttribute("aria-disabled", "true");
      app.post("/orders", {
        pickupType: activeChoice ? activeChoice.dataset.pickupType : "SELF_PICKUP",
        couponId: selectedCouponId || null,
        tableNo: tableInput ? tableInput.value : "",
        remark: remarkInput ? remarkInput.value : ""
      }).then(function () {
        app.showMessage("订单提交成功");
        window.setTimeout(function () {
          window.location.href = "order.html";
        }, 500);
      }).catch(function (error) {
        app.showMessage(error.message);
        submitButton.textContent = "提交订单";
        submitButton.removeAttribute("aria-disabled");
      });
    });
  }

  if (!app.isLoggedIn()) {
    app.get("/store").then(renderStore).catch(function () {});
    renderLoginRequired();
    return;
  }

  Promise.all([app.get("/cart"), app.get("/coupons"), app.get("/store")])
    .then(function (result) {
      cartSummary = result[0] || cartSummary;
      coupons = (result[1] || []).filter(function (coupon) {
        return coupon.available;
      });
      selectedCouponId = coupons.length ? coupons[0].id : "";
      renderStore(result[2]);
      renderAll();
    })
    .catch(function (error) {
      app.showMessage(error.message);
    });
});
