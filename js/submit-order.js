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

  function selectedDiscount() {
    var coupon = coupons.find(function (item) {
      return item.id === selectedCouponId;
    });
    return coupon ? Number(coupon.discountAmount || 0) : 0;
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
        '<div><strong class="info-title">' + app.escapeHtml(item.productName) + ' × ' + item.quantity + '</strong><p class="info-text">' + app.escapeHtml(item.spec || "Regular") + '</p></div>' +
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
      if (!cartSummary.totalQuantity) {
        app.showMessage("购物车为空，无法提交订单");
        return;
      }
      var choiceButtons = Array.from(document.querySelectorAll("[data-choice-group] [data-choice]"));
      var activeChoiceIndex = choiceButtons.findIndex(function (button) {
        return button.classList.contains("is-active");
      });
      var pickupTypes = ["SELF_PICKUP", "DINE_IN", "DELIVERY"];
      submitButton.textContent = "提交中...";
      app.post("/orders", {
        pickupType: pickupTypes[activeChoiceIndex >= 0 ? activeChoiceIndex : 0],
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
      });
    });
  }

  Promise.all([app.get("/cart"), app.get("/coupons")])
    .then(function (result) {
      cartSummary = result[0] || cartSummary;
      coupons = (result[1] || []).filter(function (coupon) {
        return coupon.available;
      });
      selectedCouponId = coupons.length ? coupons[0].id : "";
      renderAll();
    })
    .catch(function (error) {
      app.showMessage(error.message);
    });
});
