/**
 * 省钱卡页交互。
 *
 * 保留原后端接口:
 *   1. GET  /saving-card/plans
 *   2. GET  /coupons
 *   3. GET  /user/coupons
 *   4. GET  /products
 *   5. POST /saving-card/open
 *   6. POST /user/coupons/{id}/claim
 */
document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var shell = document.querySelector(".saving-shell");
  var openButtons = Array.prototype.slice.call(document.querySelectorAll("[data-open-saving-card]"));
  var savingCardOpened = false;
  var couponsCache = [];
  var userCouponStatus = {};

  function escapeHtml(value) {
    if (app && app.escapeHtml) return app.escapeHtml(value);
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function compactMoney(value, fallback) {
    var num = Number(value);
    if (!Number.isFinite(num)) return fallback || "¥18";
    var text = num % 1 === 0 ? num.toFixed(0) : num.toFixed(1);
    return "¥" + text;
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(function (node) {
      node.textContent = value;
    });
  }

  function setOpenButtonText(text) {
    setText("[data-open-label]", text);
  }

  function setOpenButtonsDisabled(disabled) {
    openButtons.forEach(function (btn) {
      btn.disabled = disabled;
    });
  }

  function setOpenedVisualState() {
    if (shell) shell.classList.add("is-opened");
    setOpenButtonsDisabled(false);
    setOpenButtonText("去点餐");
    setText("[data-member-status]", "已开通");
    setText("[data-action-caption]", "权益生效中");
    setText("[data-floating-saving]", "券包已解锁，结算更优惠");
    var floatingCopy = document.querySelector(".floating-copy strong");
    if (floatingCopy) floatingCopy.textContent = "省钱卡权益已生效";
  }

  function couponCondition(coupon) {
    if (coupon.conditionText) return coupon.conditionText;
    var minAmount = Number(coupon.minAmount || 0).toFixed(0);
    return "满 " + minAmount + " 元可用";
  }

  function renderCoupons() {
    var box = document.querySelector("[data-saving-coupons]");
    var countText = document.querySelector("[data-coupon-count-text]");
    if (!box) return;

    var list = couponsCache.slice(0, 4);
    if (countText) countText.textContent = list.length ? "共 " + list.length + " 张" : "暂无可领";

    if (!list.length) {
      box.innerHTML = '<div class="saving-empty">暂无可领取优惠券</div>';
      return;
    }

    box.innerHTML = list.map(function (coupon, index) {
      var status = userCouponStatus[coupon.id];
      var used = status === "USED";
      var claimed = status === "AVAILABLE" || used;
      var buttonText = used ? "已使用" : (claimed ? "已领取" : (savingCardOpened ? "立即领取" : "开通后可领"));
      var buttonClass = used ? " is-used" : (claimed ? " is-claimed" : (savingCardOpened ? "" : " is-locked"));
      var disabled = (claimed || !savingCardOpened) ? " disabled" : "";
      var warmClass = index % 2 === 1 ? " is-warm" : "";
      var discount = Number(coupon.discountAmount || 0).toFixed(0);

      return '<article class="saving-ticket' + warmClass + '" data-coupon-id="' + escapeHtml(coupon.id) + '">'
        + '<div class="ticket-value"><small>¥</small>' + discount + '</div>'
        + '<div class="ticket-main">'
        + '<strong class="ticket-title">' + escapeHtml(coupon.title || "省钱卡专享券") + '</strong>'
        + '<span class="ticket-cond">' + escapeHtml(couponCondition(coupon)) + '</span>'
        + '</div>'
        + '<button class="ticket-btn' + buttonClass + '" type="button"' + disabled + '>' + buttonText + '</button>'
        + '</article>';
    }).join("");
  }

  function markSavingCardOpened() {
    savingCardOpened = true;
    setOpenedVisualState();
    renderCoupons();
  }

  function loadPlans() {
    if (!app || !app.get) return Promise.resolve();

    return app.get("/saving-card/plans").then(function (plans) {
      var plan = (plans || [])[0];
      if (!plan) return;
      var price = compactMoney(plan.price, "¥18");
      setText("[data-plan-price]", price);
      setText("[data-floating-price]", price);
      setText("[data-plan-name]", plan.name || "月卡权益 · 校园专享");
    }).catch(function () {
      return null;
    });
  }

  function refreshState() {
    if (!app || !app.isLoggedIn || !app.isLoggedIn()) return Promise.resolve();

    return app.get("/mine").then(function (profile) {
      if (profile && /省钱卡/.test(profile.memberLevel || "")) {
        markSavingCardOpened();
      }
    }).catch(function () {
      return null;
    });
  }

  function loadCoupons() {
    if (!app || !app.get) return Promise.resolve();

    var jobs = [
      app.get("/coupons").catch(function () { return []; })
    ];

    if (app.isLoggedIn && app.isLoggedIn()) {
      jobs.push(app.get("/user/coupons").catch(function () { return []; }));
    } else {
      jobs.push(Promise.resolve([]));
    }

    return Promise.all(jobs).then(function (res) {
      couponsCache = (res[0] || []).filter(function (coupon) {
        return coupon.available !== false;
      }).slice(0, 4);

      userCouponStatus = {};
      (res[1] || []).forEach(function (coupon) {
        userCouponStatus[coupon.couponId || coupon.id] = coupon.status;
      });

      renderCoupons();
    });
  }

  function renderProducts() {
    var productBox = document.querySelector("[data-saving-products]");
    if (!productBox || !app || !app.get) return;

    app.get("/products").then(function (list) {
      var items = (list || []).slice(0, 3);
      if (!items.length) {
        productBox.innerHTML = '<div class="saving-empty">暂无省钱价商品</div>';
        return;
      }

      productBox.innerHTML = items.map(function (product) {
        var price = Number(product.price || 0);
        var savingPrice = Math.max(price * 0.85, 0);
        var saved = Math.max(price - savingPrice, 0);

        return '<a class="saving-product" href="/detail.html?id=' + encodeURIComponent(product.id) + '">'
          + '<img src="' + app.imageUrl(product.image) + '" alt="' + escapeHtml(product.name) + '" onerror="this.src=\'/images/common/food-placeholder.svg\'">'
          + '<div class="product-copy">'
          + '<strong>' + escapeHtml(product.name) + '</strong>'
          + '<em>会员省 ' + compactMoney(saved, "¥0") + '</em>'
          + '<div class="product-price-line"><span>' + compactMoney(savingPrice, "¥0") + '</span><del>' + compactMoney(price, "¥0") + '</del></div>'
          + '</div>'
          + '<span class="product-add">+</span>'
          + '</a>';
      }).join("");
    }).catch(function () {
      productBox.innerHTML = '<div class="saving-empty">商品加载失败</div>';
    });
  }

  function redirectToLogin() {
    if (app && app.showMessage) app.showMessage("请先登录后使用省钱卡");
    window.setTimeout(function () {
      window.location.href = "/mine.html";
    }, 500);
  }

  openButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
        redirectToLogin();
        return;
      }
      if (savingCardOpened) {
        window.location.href = "/menu.html";
        return;
      }

      setOpenButtonsDisabled(true);
      setOpenButtonText("开通中...");

      app.post("/saving-card/open", {})
        .then(function () {
          markSavingCardOpened();
          if (app.showMessage) app.showMessage("省钱卡已开通");
          return loadCoupons();
        })
        .catch(function (error) {
          if (app.showMessage) app.showMessage(error.message || "开通失败");
          setOpenButtonsDisabled(false);
          setOpenButtonText("立即开通");
          setText("[data-action-caption]", "首月特惠");
        });
    });
  });

  var couponBox = document.querySelector("[data-saving-coupons]");
  if (couponBox) {
    couponBox.addEventListener("click", function (event) {
      var btn = event.target.closest(".ticket-btn");
      var item = event.target.closest("[data-coupon-id]");
      if (!btn || !item) return;

      if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
        redirectToLogin();
        return;
      }
      if (btn.disabled) return;

      var couponId = item.dataset.couponId;
      if (!couponId) return;

      btn.disabled = true;
      btn.textContent = "领取中...";

      app.post("/user/coupons/" + encodeURIComponent(couponId) + "/claim", {})
        .then(function () {
          userCouponStatus[couponId] = "AVAILABLE";
          renderCoupons();
          if (app.showMessage) app.showMessage("优惠券已领取");
        })
        .catch(function (error) {
          renderCoupons();
          if (app.showMessage) app.showMessage(error.message || "领取失败");
        });
    });
  }

  loadPlans();
  refreshState().then(loadCoupons);
  renderProducts();
});
