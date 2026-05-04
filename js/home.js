document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var storeNameNode = document.querySelector(".store-name");
  var storeMetaNode = document.querySelector(".store-meta");
  var storeAddressNode = document.querySelector(".store-address");
  var searchInput = document.querySelector(".search-input");
  var productStack = document.querySelector(".product-stack");
  var couponStrip = document.querySelector(".coupon-strip");
  var announcementList = document.querySelector(".announcement-list");
  var cards = document.querySelectorAll("[data-service-card]");

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

  function renderProducts(products) {
    if (!productStack) {
      return;
    }
    var hotProducts = (products || []).slice(0, 3);
    if (hotProducts.length === 0) {
      productStack.innerHTML = '<p class="section-note">暂无推荐商品。</p>';
      return;
    }
    productStack.innerHTML = hotProducts.map(function (product) {
      var tags = (product.tags || []).slice(0, 2).map(function (tag) {
        return '<span class="tag">' + app.escapeHtml(tag) + '</span>';
      }).join("");
      return '<article class="product-card">' +
        '<img class="cover-thumb" src="' + app.imageUrl(product.image) + '" alt="' + app.escapeHtml(product.name) + '" onerror="this.src=\'images/food-placeholder.svg\'">' +
        '<div class="product-body">' +
          '<div class="tag-row">' + tags + '</div>' +
          '<h3 class="product-name">' + app.escapeHtml(product.name) + '</h3>' +
          '<p class="product-desc">' + app.escapeHtml(product.description) + '</p>' +
          '<div class="price-line">' +
            '<strong class="price">' + app.money(product.price) + '</strong>' +
            '<a class="mini-link" href="detail.html?id=' + encodeURIComponent(product.id) + '">查看详情</a>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join("");
  }

  function renderCoupons(coupons) {
    if (!couponStrip) {
      return;
    }
    var available = (coupons || []).filter(function (coupon) {
      return coupon.available;
    }).slice(0, 2);
    if (available.length === 0) {
      return;
    }
    couponStrip.innerHTML = available.map(function (coupon) {
      return '<div class="coupon-item">' +
        '<strong>' + app.escapeHtml(coupon.title) + '</strong>' +
        '<span>' + app.escapeHtml(coupon.conditionText) + ' · 减 ' + app.money(coupon.discountAmount) + '</span>' +
      '</div>';
    }).join("");
  }

  function renderNotice(store) {
    if (!announcementList || !store) {
      return;
    }
    announcementList.innerHTML = '<div class="info-row">' +
      '<div><strong class="info-title">门店公告</strong><p class="info-text">' + app.escapeHtml(store.notice || "欢迎使用无人移动点餐系统。") + '</p></div>' +
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

  Promise.all([app.get("/store"), app.get("/products"), app.get("/coupons")])
    .then(function (result) {
      renderStore(result[0]);
      renderProducts(result[1]);
      renderCoupons(result[2]);
      renderNotice(result[0]);
    })
    .catch(function (error) {
      app.showMessage(error.message);
    });
});
