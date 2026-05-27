/**
 * 省钱卡页交互。
 *
 * 三块功能:
 *   1. "开通省钱卡"按钮 —— 调 /saving-card/open 升级会员等级
 *   2. 省钱价商品(取前 3 个商品,展示 85 折优惠)
 *   3. 优惠券领取 —— 必须先开通省钱卡才能领,后端有强制校验
 *
 * 业务规则:省钱卡 = "会员"概念,开通后才能领券。
 */
document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var openButtons = document.querySelectorAll("[data-open-saving-card]");
  var savingCardOpened = false;   // 内存标志,避免重复开通

  /** 把开通按钮置灰为"已开通",视觉反馈用户已是会员。 */
  function markSavingCardOpened() {
    savingCardOpened = true;
    openButtons.forEach(function (btn) {
      btn.disabled = true;
      btn.textContent = "已开通";
    });
  }

  /**
   * 加载页面时检查用户是不是已经开通过省钱卡。
   * 通过查询 /mine 的 memberLevel 字段是否包含"省钱卡"判断。
   */
  function refreshState() {
    if (!app || !app.isLoggedIn || !app.isLoggedIn()) return Promise.resolve();
    return app.get("/mine").then(function (profile) {
      if (profile && /省钱卡/.test(profile.memberLevel || "")) {
        markSavingCardOpened();
      }
    }).catch(function () {});   // 失败静默,不影响其他功能
  }

  // 给开通按钮绑点击事件
  openButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      // 未登录 → 引导用户去登录
      if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
        if (app && app.showMessage) app.showMessage("请先登录后开通省钱卡");
        window.setTimeout(function () { window.location.href = "mine.html"; }, 500);
        return;
      }
      if (savingCardOpened) return;  // 已开通就不再请求
      btn.disabled = true;
      var origin = btn.textContent;
      btn.textContent = "开通中...";   // 状态提示,防止用户多次点击
      app.post("/saving-card/open", {})
        .then(function () {
          markSavingCardOpened();
          if (app && app.showMessage) app.showMessage("省钱卡已开通");
        })
        .catch(function (error) {
          if (app && app.showMessage) app.showMessage(error.message);
          // 失败恢复按钮,让用户能重试
          btn.disabled = false;
          btn.textContent = origin;
        });
    });
  });

  refreshState();

  // ===== 省钱价商品(后端拉前 3 个) =====
  // 展示商品 85 折后的省钱卡专属价 + 原价划线对比,吸引用户开卡
  var productBox = document.querySelector("[data-saving-products]");
  if (productBox && app && app.get) {
    app.get("/products").then(function (list) {
      var items = (list || []).slice(0, 3);   // 只取前 3 个
      if (items.length === 0) {
        productBox.innerHTML = '<p style="color:#9ca3af;font-size:13px;padding:20px 0;text-align:center;width:100%">暂无省钱价商品</p>';
        return;
      }
      productBox.innerHTML = items.map(function (p) {
        // 85 折计算(暂时硬编码,以后可以做成省钱卡套餐字段)
        var saving = (Number(p.price || 0) * 0.85).toFixed(1);
        return '<a class="saving-product" href="detail.html?id=' + encodeURIComponent(p.id) + '">'
          + '<img src="' + app.imageUrl(p.image) + '" alt="' + (app.escapeHtml ? app.escapeHtml(p.name) : p.name) + '" onerror="this.src=\'images/common/food-placeholder.svg\'">'
          + '<strong class="sp-name">' + (app.escapeHtml ? app.escapeHtml(p.name) : p.name) + '</strong>'
          + '<div class="sp-price-line"><span class="sp-price">¥' + saving + '</span><span class="sp-origin">¥' + Number(p.price).toFixed(1) + '</span></div>'
        + '</a>';
      }).join("");
    }).catch(function () {
      productBox.innerHTML = '<p style="color:#9ca3af;font-size:13px;padding:20px 0;text-align:center;width:100%">加载失败</p>';
    });
  }

  // ===== 优惠券领取联调 =====
  var couponItems = document.querySelectorAll(".saving-coupon");

  /**
   * 加载页面时:
   *   1. 拉 /coupons 拿所有可领的券规则
   *   2. 已登录就再拉 /user/coupons 拿"我领过哪些"
   *   3. 把券 id 绑定到页面上的 3 张券卡(按顺序对应),已领过的把按钮置为"已领取"
   */
  function loadCoupons() {
    if (!app || !app.get) return;
    var jobs = [app.get("/coupons").catch(function(){return [];})];
    if (app.isLoggedIn && app.isLoggedIn()) {
      jobs.push(app.get("/user/coupons").catch(function(){return [];}));
    } else {
      // 未登录就用空数组占位,Promise.all 才能正常 resolve
      jobs.push(Promise.resolve([]));
    }
    Promise.all(jobs).then(function (res) {
      var all = res[0] || [];
      var mine = res[1] || [];
      // 用户已领过的券 id 集合,用于查找
      var minedIds = mine.map(function (c) { return c.couponId || c.id; });
      // 只展示可用的前 3 张券(HTML 上写死 3 张卡)
      var avail = all.filter(function (c) { return c.available !== false; }).slice(0, 3);
      couponItems.forEach(function (item, i) {
        var coupon = avail[i];
        if (!coupon) return;
        // 把券 id 写到 dataset,后面点击事件能读到
        item.dataset.couponId = coupon.id;
        var btn = item.querySelector(".sc-btn");
        if (!btn) return;
        // 已领过的标记为"已领取"
        if (minedIds.indexOf(coupon.id) >= 0) {
          btn.textContent = "已领取";
          btn.classList.add("is-claimed");
          btn.disabled = true;
        }
      });
    });
  }
  loadCoupons();

  // 给每张券卡的"立即领取"按钮绑点击
  couponItems.forEach(function (item) {
    var btn = item.querySelector(".sc-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      // 未登录 → 引导去登录
      if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
        if (app && app.showMessage) app.showMessage("请先登录后领券");
        window.setTimeout(function () { window.location.href = "mine.html"; }, 500);
        return;
      }
      // 没拿到 coupon id 说明 loadCoupons 还没返回,提示稍候
      var cid = item.dataset.couponId;
      if (!cid) { if (app.showMessage) app.showMessage("优惠券加载中,请稍后再试"); return; }
      if (btn.disabled) return;   // 已领过的按钮直接退出
      btn.disabled = true;
      btn.textContent = "领取中...";
      app.post("/user/coupons/" + encodeURIComponent(cid) + "/claim", {})
        .then(function () {
          btn.textContent = "已领取";
          btn.classList.add("is-claimed");
          if (app.showMessage) app.showMessage("已领取");
        })
        .catch(function (e) {
          // 后端最常见错误:未开通省钱卡,会返回 "请先开通省钱卡后领取优惠券"
          btn.disabled = false;
          btn.textContent = "立即领取";
          if (app.showMessage) app.showMessage(e.message);
        });
    });
  });
});
