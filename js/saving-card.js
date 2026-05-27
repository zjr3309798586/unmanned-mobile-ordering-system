document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var openButtons = document.querySelectorAll("[data-open-saving-card]");
  var savingCardOpened = false;

  function markSavingCardOpened() {
    savingCardOpened = true;
    openButtons.forEach(function (btn) {
      btn.disabled = true;
      btn.textContent = "已开通";
    });
  }

  function refreshState() {
    if (!app || !app.isLoggedIn || !app.isLoggedIn()) return Promise.resolve();
    return app.get("/mine").then(function (profile) {
      if (profile && /省钱卡/.test(profile.memberLevel || "")) {
        markSavingCardOpened();
      }
    }).catch(function () {});
  }

  openButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
        if (app && app.showMessage) app.showMessage("请先登录后开通省钱卡");
        window.setTimeout(function () { window.location.href = "mine.html"; }, 500);
        return;
      }
      if (savingCardOpened) return;
      btn.disabled = true;
      var origin = btn.textContent;
      btn.textContent = "开通中...";
      app.post("/saving-card/open", {})
        .then(function () {
          markSavingCardOpened();
          if (app && app.showMessage) app.showMessage("省钱卡已开通");
        })
        .catch(function (error) {
          if (app && app.showMessage) app.showMessage(error.message);
          btn.disabled = false;
          btn.textContent = origin;
        });
    });
  });

  refreshState();

  /* ====== 省钱价商品(后端拉前 3 个) ====== */
  var productBox = document.querySelector("[data-saving-products]");
  if (productBox && app && app.get) {
    app.get("/products").then(function (list) {
      var items = (list || []).slice(0, 3);
      if (items.length === 0) {
        productBox.innerHTML = '<p style="color:#9ca3af;font-size:13px;padding:20px 0;text-align:center;width:100%">暂无省钱价商品</p>';
        return;
      }
      productBox.innerHTML = items.map(function (p) {
        var saving = (Number(p.price || 0) * 0.85).toFixed(1);  // 省钱卡 85 折
        return '<a class="saving-product" href="detail.html?id=' + encodeURIComponent(p.id) + '">'
          + '<img src="' + app.imageUrl(p.image) + '" alt="' + (app.escapeHtml ? app.escapeHtml(p.name) : p.name) + '" onerror="this.src=\'images/food-placeholder.svg\'">'
          + '<strong class="sp-name">' + (app.escapeHtml ? app.escapeHtml(p.name) : p.name) + '</strong>'
          + '<div class="sp-price-line"><span class="sp-price">¥' + saving + '</span><span class="sp-origin">¥' + Number(p.price).toFixed(1) + '</span></div>'
        + '</a>';
      }).join("");
    }).catch(function () {
      productBox.innerHTML = '<p style="color:#9ca3af;font-size:13px;padding:20px 0;text-align:center;width:100%">加载失败</p>';
    });
  }

  /* ====== 优惠券领取联调 ====== */
  var couponItems = document.querySelectorAll(".saving-coupon");

  function loadCoupons() {
    if (!app || !app.get) return;
    var jobs = [app.get("/coupons").catch(function(){return [];})];
    if (app.isLoggedIn && app.isLoggedIn()) {
      jobs.push(app.get("/user/coupons").catch(function(){return [];}));
    } else {
      jobs.push(Promise.resolve([]));
    }
    Promise.all(jobs).then(function (res) {
      var all = res[0] || [];
      var mine = res[1] || [];
      var minedIds = mine.map(function (c) { return c.couponId || c.id; });
      // 给每个 .saving-coupon 绑定 id(按列表顺序对应)
      var avail = all.filter(function (c) { return c.available !== false; }).slice(0, 3);
      couponItems.forEach(function (item, i) {
        var coupon = avail[i];
        if (!coupon) return;
        item.dataset.couponId = coupon.id;
        var btn = item.querySelector(".sc-btn");
        if (!btn) return;
        if (minedIds.indexOf(coupon.id) >= 0) {
          btn.textContent = "已领取";
          btn.classList.add("is-claimed");
          btn.disabled = true;
        }
      });
    });
  }
  loadCoupons();

  couponItems.forEach(function (item) {
    var btn = item.querySelector(".sc-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
        if (app && app.showMessage) app.showMessage("请先登录后领券");
        window.setTimeout(function () { window.location.href = "mine.html"; }, 500);
        return;
      }
      var cid = item.dataset.couponId;
      if (!cid) { if (app.showMessage) app.showMessage("优惠券加载中,请稍后再试"); return; }
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = "领取中...";
      app.post("/user/coupons/" + encodeURIComponent(cid) + "/claim", {})
        .then(function () {
          btn.textContent = "已领取";
          btn.classList.add("is-claimed");
          if (app.showMessage) app.showMessage("已领取");
        })
        .catch(function (e) {
          btn.disabled = false;
          btn.textContent = "立即领取";
          if (app.showMessage) app.showMessage(e.message);
        });
    });
  });
});
