document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var priceNode = document.querySelector("[data-current-plan-price]");
  var noteNode = document.querySelector("[data-current-plan-note]");
  var planGrid = document.querySelector(".plan-grid");
  var couponStack = document.querySelector(".coupon-stack");
  var productStack = document.querySelector(".product-stack");
  var benefitList = document.querySelector(".benefit-list");
  var openSavingCardButton = document.querySelector("[data-open-saving-card]");
  var publicCoupons = [];
  var couponStatusMap = {};
  var savingCardOpened = false;

  function renderPlans(plans) {
    if (!planGrid || !plans || plans.length === 0) {
      return;
    }
    planGrid.innerHTML = plans.map(function (plan, index) {
      return '<button class="plan-card ' + (index === 0 ? "is-active" : "") + '" type="button" data-plan data-price="' + Number(plan.price || 0).toFixed(2) + '" data-note="/ ' + app.escapeHtml(plan.name) + ' · ' + app.escapeHtml(plan.description || "") + '">' +
        '<strong>' + app.escapeHtml(plan.name) + '</strong>' +
        '<span>' + app.money(plan.price) + '</span>' +
        '<small>' + app.escapeHtml((plan.benefits || [])[0] || "会员权益") + '</small>' +
      '</button>';
    }).join("");
    syncCurrentPlan(planGrid.querySelector("[data-plan]"));
    renderBenefits(plans[0]);
  }

  function renderCoupons(coupons) {
    if (!couponStack) {
      return;
    }
    var available = (coupons || []).filter(function (coupon) {
      return coupon.available;
    }).slice(0, 3);
    if (available.length === 0) {
      couponStack.innerHTML = '<p class="section-note">当前暂无专属优惠券。</p>';
      return;
    }
    couponStack.innerHTML = available.map(function (coupon) {
      var status = couponStatusMap[coupon.id];
      var disabled = status === "AVAILABLE" || status === "USED";
      var label = status === "USED" ? "已使用" : (status === "AVAILABLE" ? "已领取" : "领取");
      return '<div class="member-coupon">' +
        '<strong class="coupon-value">减 ' + app.money(coupon.discountAmount).replace("¥ ", "") + '</strong>' +
        '<div><strong>' + app.escapeHtml(coupon.title) + '</strong>' +
        '<span>' + app.escapeHtml(coupon.conditionText) + ' · 减 ' + app.money(coupon.discountAmount) + '</span></div>' +
        '<button class="mini-link" type="button" data-claim-coupon="' + app.escapeHtml(coupon.id) + '"' + (disabled ? " disabled" : "") + '>' + label + '</button>' +
      '</div>';
    }).join("");
  }

  function refreshUserCoupons() {
    if (!app.isLoggedIn()) {
      couponStatusMap = {};
      return Promise.resolve([]);
    }
    return app.get("/user/coupons").then(function (coupons) {
      couponStatusMap = {};
      (coupons || []).forEach(function (coupon) {
        couponStatusMap[coupon.couponId || coupon.id] = coupon.status;
      });
      return coupons;
    }).catch(function () {
      couponStatusMap = {};
      return [];
    });
  }

  function renderProducts(products) {
    if (!productStack) {
      return;
    }
    var list = (products || []).slice(0, 2);
    if (list.length === 0) {
      productStack.innerHTML = '<p class="section-note">当前暂无省钱价商品。</p>';
      return;
    }
    productStack.innerHTML = list.map(function (product) {
      var savingPrice = Number(product.price || 0) * 0.85;
      return '<article class="product-card">' +
        '<img class="cover-thumb" src="' + app.imageUrl(product.image) + '" alt="' + app.escapeHtml(product.name) + '" onerror="this.src=\'images/food-placeholder.svg\'">' +
        '<div class="product-body">' +
          '<div class="tag-row"><span class="tag">省钱卡价</span><span class="tag muted-tag">会员专享</span></div>' +
          '<h3 class="product-name">' + app.escapeHtml(product.name) + '</h3>' +
          '<p class="product-desc">' + app.escapeHtml(product.description) + '</p>' +
          '<div class="price-line"><strong class="price">' + app.money(savingPrice) + '</strong><a class="mini-link" href="detail.html?id=' + encodeURIComponent(product.id) + '">去购买</a></div>' +
          '<span class="tiny-note">原价 ' + app.money(product.price) + '</span>' +
        '</div>' +
      '</article>';
    }).join("");
  }

  function renderBenefits(plan) {
    if (!benefitList || !plan) {
      return;
    }
    benefitList.innerHTML = (plan.benefits || []).map(function (benefit) {
      return '<div class="benefit-item">' +
        '<span class="benefit-icon">权</span>' +
        '<div><strong class="info-title">' + app.escapeHtml(benefit) + '</strong><p class="info-text">' + app.escapeHtml(plan.description || "开通后可享受会员专属权益。") + '</p></div>' +
      '</div>';
    }).join("");
  }

  function syncCurrentPlan(button) {
    if (!button) {
      return;
    }
    if (priceNode) {
      priceNode.textContent = app.money(button.dataset.price);
    }
    if (noteNode) {
      noteNode.textContent = button.dataset.note;
    }
  }

  function markSavingCardOpened() {
    savingCardOpened = true;
    if (openSavingCardButton) {
      openSavingCardButton.textContent = "已开通省钱卡";
      openSavingCardButton.disabled = true;
    }
  }

  function refreshSavingCardState() {
    if (!app.isLoggedIn()) {
      return Promise.resolve();
    }
    return app.get("/mine").then(function (profile) {
      if (profile && /省钱卡/.test(profile.memberLevel || "")) {
        markSavingCardOpened();
      }
    }).catch(function () {});
  }

  if (planGrid) {
    planGrid.addEventListener("click", function (event) {
      var button = event.target.closest("[data-plan]");
      if (!button) {
        return;
      }
      planGrid.querySelectorAll("[data-plan]").forEach(function (item) {
        item.classList.remove("is-active");
      });
      button.classList.add("is-active");
      syncCurrentPlan(button);
    });
  }

  if (couponStack) {
    couponStack.addEventListener("click", function (event) {
      var button = event.target.closest("[data-claim-coupon]");
      if (!button || button.disabled) {
        return;
      }
      if (!app.isLoggedIn()) {
        app.showMessage("请先登录后领取优惠券");
        window.setTimeout(function () {
          window.location.href = "mine.html";
        }, 500);
        return;
      }
      if (!savingCardOpened) {
        app.showMessage("请先开通省钱卡后领取优惠券");
        return;
      }
      var couponId = button.dataset.claimCoupon;
      button.disabled = true;
      button.textContent = "领取中";
      app.post("/user/coupons/" + encodeURIComponent(couponId) + "/claim", {})
        .then(function () {
          app.showMessage("优惠券已领取");
          return refreshUserCoupons();
        })
        .then(function () {
          renderCoupons(publicCoupons);
        })
        .catch(function (error) {
          app.showMessage(error.message);
          button.disabled = false;
          button.textContent = "领取";
        });
    });
  }

  if (openSavingCardButton) {
    openSavingCardButton.addEventListener("click", function () {
      if (!app.isLoggedIn()) {
        app.showMessage("请先登录后开通省钱卡");
        window.setTimeout(function () {
          window.location.href = "mine.html";
        }, 500);
        return;
      }
      openSavingCardButton.disabled = true;
      openSavingCardButton.textContent = "开通中";
      app.post("/saving-card/open", {})
        .then(function () {
          markSavingCardOpened();
          app.showMessage("省钱卡已开通");
        })
        .catch(function (error) {
          app.showMessage(error.message);
          openSavingCardButton.disabled = false;
          openSavingCardButton.textContent = "立即开通省钱卡";
        });
    });
  }

  Promise.all([app.get("/saving-card/plans"), app.get("/coupons"), app.get("/products"), refreshUserCoupons(), refreshSavingCardState()])
    .then(function (result) {
      publicCoupons = result[1] || [];
      renderPlans(result[0]);
      renderCoupons(publicCoupons);
      renderProducts(result[2]);
    })
    .catch(function (error) {
      app.showMessage(error.message);
    });
});
