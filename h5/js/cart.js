document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var payBtn = document.querySelector("[data-pay]");
  var totalQtyNode = document.querySelector("[data-total-qty]");
  var totalAmtNode = document.querySelector("[data-total-amount]");
  var payIntNode = document.querySelector("[data-pay-int]");
  var payDecNode = document.querySelector("[data-pay-dec]");
  var payOriginNode = document.querySelector("[data-pay-origin]");
  var savedNode = document.querySelector("[data-saved]");
  var itemsBox = document.querySelector("[data-cart-items]");
  var emptyCard = document.querySelector("[data-cart-empty]");
  var cartCard = document.querySelector("[data-cart-card]");
  var drNameNode = document.querySelector("[data-dr-name]");
  var drAmtNode = document.querySelector("[data-dr-amount]");
  var drHintNode = document.querySelector("[data-dr-hint]");
  var couponEntry = document.querySelector("[data-coupon-entry]");
  var couponMask = document.querySelector("[data-coupon-mask]");
  var couponDrawer = document.querySelector("[data-coupon-drawer]");
  var couponList = document.querySelector("[data-coupon-list]");
  var couponClose = document.querySelector("[data-coupon-close]");
  var couponClear = document.querySelector("[data-coupon-clear]");

  var cart = { items: [], totalAmount: 0, totalQuantity: 0 };
  var myCoupons = [];           // 已领可用券
  var selectedCoupon = null;    // {id, title, conditionAmount, discountAmount}

  /* ===== 渲染购物车 ===== */
  function renderCart() {
    var items = cart.items || [];
    if (items.length === 0) {
      if (cartCard) cartCard.style.display = "none";
      if (emptyCard) emptyCard.style.display = "";
      if (totalQtyNode) totalQtyNode.textContent = 0;
      if (totalAmtNode) totalAmtNode.textContent = 0;
      recalc();
      return;
    }
    if (cartCard) cartCard.style.display = "";
    if (emptyCard) emptyCard.style.display = "none";
    if (itemsBox) {
      itemsBox.innerHTML = items.map(function (it) {
        var sub = Number(it.subtotal != null ? it.subtotal : Number(it.price) * Number(it.quantity)) || 0;
        var img = it.image ? (app.imageUrl ? app.imageUrl(it.image) : it.image) : "/images/menu/menu-product-milk-tea.png";
        return '<article class="cart-item" data-default-item data-id="' + escapeHtml(it.id) + '" data-price="' + Number(it.price || 0) + '" data-qty="' + Number(it.quantity || 1) + '">'
          + '<div class="ci-thumb"><img src="' + img + '" onerror="this.src=\'images/common/food-placeholder.svg\'"></div>'
          + '<div class="ci-body">'
          +   '<div class="ci-row1"><h4 class="ci-name">' + escapeHtml(it.productName || it.name || "商品") + '</h4>'
          +     '<div class="ci-price"><span class="ci-yuan">¥</span><span class="ci-int">' + sub.toFixed(1) + '</span></div></div>'
          +   '<p class="ci-spec">' + escapeHtml(it.specText || (typeof it.spec === "string" ? it.spec : "标准杯")) + '</p>'
          +   '<div class="ci-row3"><span></span><span class="ci-qty">x' + it.quantity + '</span></div>'
          + '</div>'
        + '</article>';
      }).join("");
    }
    recalc();
  }

  function escapeHtml(v) { return app && app.escapeHtml ? app.escapeHtml(v == null ? "" : v) : String(v || ""); }

  /* ===== 重算金额 + 优惠 ===== */
  function recalc() {
    var total = Number(cart.totalAmount || 0);
    if (!total && cart.items) {
      total = cart.items.reduce(function (s, it) { return s + Number(it.price || 0) * Number(it.quantity || 1); }, 0);
    }
    var qty = Number(cart.totalQuantity || 0);
    if (!qty && cart.items) {
      qty = cart.items.reduce(function (s, it) { return s + Number(it.quantity || 1); }, 0);
    }
    var saved = 0;
    if (selectedCoupon && total >= Number(selectedCoupon.conditionAmount || 0)) {
      saved = Number(selectedCoupon.discountAmount || 0);
    }
    var pay = Math.max(total - saved, 0);
    var pi = pay.toFixed(1).split(".");
    if (totalQtyNode) totalQtyNode.textContent = qty;
    if (totalAmtNode) totalAmtNode.textContent = total.toFixed(1);
    if (payIntNode) payIntNode.textContent = pi[0];
    if (payDecNode) payDecNode.textContent = "." + (pi[1] || "0");
    if (payOriginNode) payOriginNode.textContent = "¥" + total.toFixed(1);
    if (savedNode) savedNode.textContent = "¥" + saved.toFixed(1);

    if (selectedCoupon) {
      if (drNameNode) drNameNode.textContent = selectedCoupon.title;
      if (drAmtNode) drAmtNode.textContent = "-¥" + saved.toFixed(1);
      if (drHintNode) drHintNode.textContent = saved > 0 ? "已使用" : ("满 ¥" + Number(selectedCoupon.conditionAmount || 0).toFixed(0) + " 可用,当前未满");
    } else {
      if (drNameNode) drNameNode.textContent = myCoupons.length > 0 ? "未选择优惠券" : "暂无可用优惠券";
      if (drAmtNode) drAmtNode.textContent = "-¥0.0";
      if (drHintNode) drHintNode.textContent = myCoupons.length > 0 ? "点击右上角选择券" : "去省钱卡领券更优惠";
    }
  }

  /* ===== 加载数据 ===== */
  function loadAll() {
    if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
      cart = { items: [], totalAmount: 0, totalQuantity: 0 };
      myCoupons = [];
      renderCart();
      return;
    }
    Promise.all([
      app.get("/cart").catch(function () { return null; }),
      app.get("/user/coupons").catch(function () { return []; })
    ]).then(function (res) {
      cart = res[0] || { items: [], totalAmount: 0, totalQuantity: 0 };
      var coupons = res[1] || [];
      // 只取已领待用且 status=AVAILABLE 的
      myCoupons = coupons.filter(function (c) {
        return (c.status === "AVAILABLE" || !c.status);
      }).map(function (c) {
        return {
          id: c.couponId || c.id,
          title: c.title || "优惠券",
          conditionAmount: Number(c.conditionAmount || 0),
          discountAmount: Number(c.discountAmount || 0),
          conditionText: c.conditionText || ("满 " + (c.conditionAmount || 0) + " 减 " + (c.discountAmount || 0))
        };
      });
      // 自动选最优(满门槛 & 减最多)
      var total = Number(cart.totalAmount || 0);
      var usable = myCoupons.filter(function (c) { return total >= c.conditionAmount; });
      if (usable.length > 0) {
        usable.sort(function (a, b) { return b.discountAmount - a.discountAmount; });
        selectedCoupon = usable[0];
      } else {
        selectedCoupon = null;
      }
      renderCart();
    });
  }

  /* ===== 抽屉 ===== */
  function openDrawer() {
    if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
      if (app && app.showMessage) app.showMessage("请先登录");
      return;
    }
    renderCouponList();
    if (couponDrawer) couponDrawer.classList.add("is-open");
    if (couponMask) couponMask.classList.add("is-open");
  }
  function closeDrawer() {
    if (couponDrawer) couponDrawer.classList.remove("is-open");
    if (couponMask) couponMask.classList.remove("is-open");
  }
  function renderCouponList() {
    if (!couponList) return;
    if (myCoupons.length === 0) {
      couponList.innerHTML = '<p class="cd-coupon-empty">还没有可用优惠券<br>去省钱卡领一张</p>';
      return;
    }
    var total = Number(cart.totalAmount || 0);
    // 把可用券排前面、不可用排后面;不可用的也展示,让用户能"凑单"
    var sorted = myCoupons.slice().sort(function (a, b) {
      var aOk = total >= a.conditionAmount ? 0 : 1;
      var bOk = total >= b.conditionAmount ? 0 : 1;
      if (aOk !== bOk) return aOk - bOk;
      return b.discountAmount - a.discountAmount;
    });
    couponList.innerHTML = sorted.map(function (c) {
      var usable = total >= c.conditionAmount;
      var isSel = selectedCoupon && selectedCoupon.id === c.id;
      var gap = usable ? 0 : (c.conditionAmount - total);
      var cls = "cd-coupon" + (isSel ? " is-selected" : "") + (usable ? "" : " is-disabled");
      var condHtml = escapeHtml(c.conditionText);
      if (!usable) {
        condHtml += ' <span class="cdc-gap">还差 ¥' + gap.toFixed(1) + '</span>';
      }
      return '<div class="' + cls + '" data-coupon-pick="' + escapeHtml(c.id) + '" data-coupon-usable="' + (usable ? "1" : "0") + '" data-coupon-gap="' + gap.toFixed(1) + '">'
        + '<div class="cdc-amount"><span class="cdc-yuan">¥</span><span class="cdc-int">' + c.discountAmount + '</span></div>'
        + '<div class="cdc-body"><div class="cdc-title">' + escapeHtml(c.title) + '</div><div class="cdc-cond">' + condHtml + '</div></div>'
      + '</div>';
    }).join("");
  }
  if (couponEntry) couponEntry.addEventListener("click", openDrawer);
  if (couponClose) couponClose.addEventListener("click", closeDrawer);
  if (couponMask) couponMask.addEventListener("click", closeDrawer);
  if (couponClear) couponClear.addEventListener("click", function () { selectedCoupon = null; recalc(); closeDrawer(); });
  if (couponList) couponList.addEventListener("click", function (e) {
    var item = e.target.closest("[data-coupon-pick]");
    if (!item) return;
    if (item.classList.contains("is-disabled")) {
      var gap = item.dataset.couponGap || "0.0";
      if (app && app.showMessage) app.showMessage("还差 ¥" + gap + " 可用");
      return;
    }
    var id = item.dataset.couponPick;
    selectedCoupon = myCoupons.find(function (c) { return String(c.id) === String(id); }) || null;
    recalc();
    closeDrawer();
  });

  /* ===== 下单 ===== */
  if (payBtn) {
    payBtn.addEventListener("click", function () {
      if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
        if (app && app.showMessage) app.showMessage("请先登录后支付");
        window.setTimeout(function () { window.location.href = "mine.html"; }, 500);
        return;
      }
      if (!cart.items || cart.items.length === 0) {
        if (app && app.showMessage) app.showMessage("购物车为空");
        return;
      }
      payBtn.disabled = true;
      payBtn.textContent = "支付中...";
      var body = { source: "cart", pickupType: "PICKUP" };
      if (selectedCoupon && selectedCoupon.id) {
        var total = Number(cart.totalAmount || 0);
        if (total >= selectedCoupon.conditionAmount) body.couponId = selectedCoupon.id;
      }
      app.post("/orders", body)
        .then(function () {
          if (app.showMessage) app.showMessage("下单成功");
          window.setTimeout(function () { window.location.href = "order.html"; }, 500);
        })
        .catch(function (e) {
          if (app.showMessage) app.showMessage(e.message);
          payBtn.disabled = false;
          payBtn.textContent = "立即支付";
        });
    });
  }

  loadAll();
});
