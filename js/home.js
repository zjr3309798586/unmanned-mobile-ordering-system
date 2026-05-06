document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var storeNameNode = document.querySelector(".store-name");
  var storeMetaNode = document.querySelector(".store-meta");
  var storeAddressNode = document.querySelector(".store-address");
  var searchInput = document.querySelector(".search-input");
  var productStack = document.querySelector(".product-stack");
  var couponStrip = document.querySelector(".coupon-strip");
  var couponRibbon = document.querySelector("[data-coupon-ribbon]");
  var couponKicker = document.querySelector("[data-coupon-kicker]");
  var couponTitle = document.querySelector("[data-coupon-title]");
  var couponCopy = document.querySelector("[data-coupon-copy]");
  var couponAction = document.querySelector("[data-coupon-action]");
  var announcementList = document.querySelector(".announcement-list");
  var taskNote = document.querySelector("[data-task-note]");
  var taskProgress = document.querySelector("[data-task-progress]");
  var taskFootnote = document.querySelector("[data-task-footnote]");
  var cards = document.querySelectorAll("[data-service-card]");
  var bannerSection = document.querySelector(".home-banner");

  function renderStore(store) {
    if (!store) {
      return;
    }
    if (storeNameNode) {
      storeNameNode.textContent = store.name;
    }
    if (storeMetaNode) {
      storeMetaNode.innerHTML = '<span>距你 ' + app.escapeHtml(store.distance || "约 350m") + '</span>' +
        '<span>营业 ' + app.escapeHtml(store.businessHours || "09:00-21:30") + '</span>' +
        '<span>支持堂食 / 自取 / 配送</span>';
    }
    if (storeAddressNode) {
      storeAddressNode.textContent = store.address || "";
    }
  }

  function renderBanner(banners) {
    if (!bannerSection) {
      return;
    }
    var banner = (banners || [])[0];
    if (!banner) {
      return;
    }
    var badge = bannerSection.querySelector(".hero-badge");
    var title = bannerSection.querySelector(".banner-title");
    var text = bannerSection.querySelector(".banner-text");
    var image = bannerSection.querySelector(".banner-image");
    var action = bannerSection.querySelector(".hero-actions .button-primary");
    if (badge) {
      badge.textContent = banner.tagText || "门店活动";
    }
    if (title) {
      title.innerHTML = app.escapeHtml(banner.title || "").replace(/\s+/g, "<br>");
    }
    if (text) {
      text.textContent = banner.subtitle || "";
    }
    if (image) {
      image.src = app.imageUrl(banner.image);
    }
    if (action && banner.linkText) {
      action.textContent = banner.linkText;
      action.href = banner.linkUrl || "menu.html";
    }
  }

  function renderProducts(products) {
    if (!productStack) {
      return;
    }
    var hotProducts = (products || []).slice(0, 3);
    if (hotProducts.length === 0) {
      productStack.innerHTML = '<p class="section-note">暂无推荐商品。</p>';
      return;
    }
    productStack.innerHTML = hotProducts.map(function (product, index) {
      var tags = (product.tags || []).slice(0, 2).map(function (tag) {
        return '<span class="tag">' + app.escapeHtml(tag) + '</span>';
      }).join("");
      return '<article class="product-card home-product-card">' +
        '<a class="home-product-cover" href="detail.html?id=' + encodeURIComponent(product.id) + '">' +
          '<img class="cover-thumb" src="' + app.imageUrl(product.image) + '" alt="' + app.escapeHtml(product.name) + '" onerror="this.src=\'images/food-placeholder.svg\'">' +
          '<span class="rank-badge">热卖 ' + (index + 1) + '</span>' +
        '</a>' +
        '<div class="product-body">' +
          '<div class="tag-row">' + tags + '</div>' +
          '<h3 class="product-name">' + app.escapeHtml(product.name) + '</h3>' +
          '<p class="product-desc">' + app.escapeHtml(product.description) + '</p>' +
          '<div class="price-line">' +
            '<strong class="price">' + app.money(product.price) + '</strong>' +
            '<a class="mini-link product-buy-link" href="detail.html?id=' + encodeURIComponent(product.id) + '">去选购</a>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join("");
  }

  function renderCoupons(coupons) {
    var available = (coupons || []).filter(function (coupon) {
      return coupon.available;
    });
    var firstCoupon = available[0];

    if (couponRibbon) {
      couponRibbon.classList.toggle("is-empty", !firstCoupon);
    }
    if (couponKicker) {
      couponKicker.textContent = firstCoupon ? "今日优惠" : "优惠券";
    }
    if (couponTitle) {
      couponTitle.textContent = firstCoupon
        ? firstCoupon.title + " · 减 " + app.money(firstCoupon.discountAmount)
        : "当前暂无可领取优惠券";
    }
    if (couponCopy) {
      couponCopy.textContent = firstCoupon
        ? firstCoupon.conditionText + "，开通省钱卡后可领取并在结算页使用。"
        : "可在后台管理端新增优惠券，前台会自动同步。";
    }
    if (couponAction) {
      couponAction.textContent = firstCoupon ? "去领取" : "去看看";
    }

    if (!couponStrip) {
      return;
    }
    var stripCoupons = available.slice(0, 2);
    if (stripCoupons.length === 0) {
      couponStrip.innerHTML = '<p class="section-note">当前暂无可领取优惠券。</p>';
      return;
    }
    couponStrip.innerHTML = stripCoupons.map(function (coupon) {
      return '<div class="coupon-item">' +
        '<div><strong>' + app.escapeHtml(coupon.title) + '</strong>' +
        '<span>' + app.escapeHtml(coupon.conditionText) + ' · 减 ' + app.money(coupon.discountAmount) + '</span></div>' +
        '<a class="mini-link" href="saving-card.html">领取</a>' +
      '</div>';
    }).join("");
  }

  function renderTask(orders) {
    var totalCupCount = 0;
    (orders || []).forEach(function (order) {
      (order.items || []).forEach(function (item) {
        totalCupCount += Number(item.quantity || 0);
      });
    });
    var target = 8;
    var completed = Math.min(totalCupCount, target);
    var remaining = Math.max(target - completed, 0);
    var percent = Math.round((completed / target) * 100);

    if (taskNote) {
      taskNote.textContent = app.isLoggedIn()
        ? "订单杯数来自后台订单数据，累计 8 杯可得饮品券"
        : "登录后同步订单杯数，累计 8 杯可得饮品券";
    }
    if (taskProgress) {
      taskProgress.style.width = percent + "%";
    }
    if (taskFootnote) {
      taskFootnote.textContent = app.isLoggedIn()
        ? (remaining > 0
          ? "已完成 " + completed + " / " + target + " 杯，再买 " + remaining + " 杯可领取奖励。"
          : "已完成 " + target + " / " + target + " 杯，可前往省钱卡页面领取奖励。")
        : "请先登录后查看你的集杯进度。";
    }
  }

  function renderNotice(store) {
    if (!announcementList || !store) {
      return;
    }
    announcementList.innerHTML = '<div class="info-row">' +
      '<div><strong class="info-title">门店公告</strong><p class="info-text">' + app.escapeHtml(store.notice || "欢迎使用云豹小点。") + '</p></div>' +
    '</div>' +
    '<div class="info-row">' +
      '<div><strong class="info-title">营业时间</strong><p class="info-text">' + app.escapeHtml(store.businessHours || "09:00-21:30") + '</p></div>' +
    '</div>';
  }

  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      cards.forEach(function (item) {
        item.classList.remove("is-active");
      });
      card.classList.add("is-active");
    });
  });

  if (searchInput) {
    searchInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && searchInput.value.trim()) {
        window.location.href = "menu.html?keyword=" + encodeURIComponent(searchInput.value.trim());
      }
    });
  }

  Promise.all([
    app.get("/store"),
    app.get("/products"),
    app.get("/coupons"),
    app.get("/banners"),
    app.isLoggedIn() ? app.get("/orders") : Promise.resolve([])
  ])
    .then(function (result) {
      renderStore(result[0]);
      renderProducts(result[1]);
      renderCoupons(result[2]);
      renderBanner(result[3]);
      renderNotice(result[0]);
      renderTask(result[4]);
    })
    .catch(function (error) {
      app.showMessage(error.message || "后端服务未连接");
      renderTask([]);
    });
});
