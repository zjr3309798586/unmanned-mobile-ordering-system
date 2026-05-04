document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var priceNode = document.querySelector("[data-current-plan-price]");
  var noteNode = document.querySelector("[data-current-plan-note]");
  var planGrid = document.querySelector(".plan-grid");
  var couponStack = document.querySelector(".coupon-stack");
  var productStack = document.querySelector(".product-stack");
  var benefitList = document.querySelector(".benefit-list");

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
      return;
    }
    couponStack.innerHTML = available.map(function (coupon) {
      return '<div class="member-coupon">' +
        '<strong>' + app.escapeHtml(coupon.title) + '</strong>' +
        '<span>' + app.escapeHtml(coupon.conditionText) + ' · 减 ' + app.money(coupon.discountAmount) + '</span>' +
      '</div>';
    }).join("");
  }

  function renderProducts(products) {
    if (!productStack) {
      return;
    }
    var list = (products || []).slice(0, 2);
    if (list.length === 0) {
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
          '<div class="price-line"><strong class="price">' + app.money(savingPrice) + '</strong><span class="tiny-note">原价 ' + app.money(product.price) + '</span></div>' +
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

  Promise.all([app.get("/saving-card/plans"), app.get("/coupons"), app.get("/products")])
    .then(function (result) {
      renderPlans(result[0]);
      renderCoupons(result[1]);
      renderProducts(result[2]);
    })
    .catch(function (error) {
      app.showMessage(error.message);
    });
});
