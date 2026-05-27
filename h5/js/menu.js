document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var menuList = document.querySelector("[data-menu-list]");
  var catHead = document.querySelector(".ml-cat-head");
  var cartCountNode = document.querySelector("[data-cart-count]");
  var cartEmptyText = document.querySelector("[data-cart-empty-text]");
  var cartTotal = document.querySelector("[data-cart-total]");
  var cartGo = document.querySelector("[data-cart-go]");

  var cartSummary = { items: [], totalQuantity: 0, totalAmount: 0 };
  var allProducts = [];
  var allCategories = [];

  // ===== 购物车抽屉 =====
  var cartBag = document.querySelector(".cart-bag-circle");
  var cartMask = document.querySelector("[data-cart-mask]");
  var cartDrawer = document.querySelector("[data-cart-drawer]");
  var drawerList = document.querySelector("[data-cart-drawer-list]");
  var clearBtn = document.querySelector("[data-cart-clear]");

  function openDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.add("is-open");
    if (cartMask) cartMask.classList.add("is-open");
  }
  function closeDrawer() {
    if (cartDrawer) cartDrawer.classList.remove("is-open");
    if (cartMask) cartMask.classList.remove("is-open");
  }
  if (cartBag) cartBag.addEventListener("click", function () {
    if (cartDrawer && cartDrawer.classList.contains("is-open")) closeDrawer();
    else openDrawer();
  });
  if (cartMask) cartMask.addEventListener("click", closeDrawer);

  function renderDrawer() {
    if (!drawerList) return;
    var items = cartSummary.items || [];
    if (items.length === 0) {
      drawerList.innerHTML = '<p class="cd-empty">购物车空空,点商品旁的 + 加进来吧</p>';
      return;
    }
    drawerList.innerHTML = items.map(function (it) {
      var img = it.image ? (app.imageUrl ? app.imageUrl(it.image) : it.image) : "/images/common/food-placeholder.svg";
      var sub = Number((it.subtotal != null ? it.subtotal : (Number(it.price) * it.quantity)) || 0).toFixed(1);
      return '<div class="cd-item">'
        + '<img class="cd-thumb" src="' + img + '" onerror="this.src=\'images/common/food-placeholder.svg\'">'
        + '<div class="cd-body">'
        +   '<h4 class="cd-name">' + escape(it.productName || it.name || "商品") + '</h4>'
        +   '<div class="cd-spec">' + escape(it.specText || (typeof it.spec === "string" ? it.spec : "标准杯")) + '</div>'
        +   '<div class="cd-price">¥' + sub + '</div>'
        + '</div>'
        + '<div class="cd-stepper">'
        +   '<button class="cd-step-minus" type="button" data-drawer-minus="' + it.id + '">−</button>'
        +   '<span class="cd-qty">' + it.quantity + '</span>'
        +   '<button class="cd-step-plus" type="button" data-drawer-plus="' + it.id + '">+</button>'
        + '</div>'
      + '</div>';
    }).join("");
  }

  if (drawerList) {
    drawerList.addEventListener("click", function (e) {
      var minus = e.target.closest("[data-drawer-minus]");
      var plus = e.target.closest("[data-drawer-plus]");
      var target = minus || plus;
      if (!target) return;
      var itemId = target.dataset.drawerMinus || target.dataset.drawerPlus;
      var item = (cartSummary.items || []).find(function (i) { return String(i.id) === String(itemId); });
      if (!item) return;
      target.disabled = true;
      var promise;
      if (minus) {
        promise = item.quantity <= 1
          ? app.del("/cart/items/" + item.id)
          : app.patch("/cart/items/" + item.id, { quantity: item.quantity - 1 });
      } else {
        promise = app.patch("/cart/items/" + item.id, { quantity: item.quantity + 1 });
      }
      promise
        .then(function (data) { cartSummary = data || cartSummary; updateCartBar(); rerenderCurrentCat(); renderDrawer(); })
        .catch(function (err) { if (app.showMessage) app.showMessage(err.message); })
        .finally(function () { target.disabled = false; });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (!app || !app.del) return;
      clearBtn.disabled = true;
      app.del("/cart")
        .then(function (data) { cartSummary = data || { items: [], totalQuantity: 0, totalAmount: 0 }; updateCartBar(); rerenderCurrentCat(); renderDrawer(); if (app.showMessage) app.showMessage("已清空"); })
        .catch(function (err) { if (app.showMessage) app.showMessage(err.message); })
        .finally(function () { clearBtn.disabled = false; });
    });
  }

  function escape(v) {
    return app.escapeHtml ? app.escapeHtml(v == null ? "" : v) : String(v || "");
  }

  function getProductQty(productId) {
    var qty = 0;
    (cartSummary.items || []).forEach(function (ci) { if (ci.productId === productId) qty += ci.quantity; });
    return qty;
  }

  function renderProducts(products) {
    if (!menuList) return;
    var container = menuList.querySelector(".ml-items");
    if (!container) return;
    container.innerHTML = (products || []).map(function (p) {
      var price = Number(p.price || 0).toFixed(1).split(".");
      var qty = getProductQty(p.id);
      var minusHtml = qty > 0
        ? '<button class="m-minus" type="button" data-minus-product="' + p.id + '"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg></button>'
          + '<span class="m-qty">' + qty + '</span>'
        : '';
      return '<article class="m-card" data-card-id="' + p.id + '">'
        + '<a class="m-cover" href="detail.html?id=' + encodeURIComponent(p.id) + '">'
        +   '<img src="' + app.imageUrl(p.image) + '" alt="' + escape(p.name) + '" onerror="this.src=\'images/common/food-placeholder.svg\'">'
        + '</a>'
        + '<div class="m-body">'
        +   '<h3 class="m-name"><a class="plain-link" href="detail.html?id=' + encodeURIComponent(p.id) + '">' + escape(p.name) + '</a></h3>'
        +   '<div class="m-attr-row"><span class="m-tag-attr">' + escape(p.description) + '</span></div>'
        +   '<div class="m-price-row">'
        +     '<div class="m-price">'
        +       '<span class="m-yuan">¥</span>'
        +       '<span class="m-int">' + price[0] + '</span>'
        +       '<span class="m-dec">.' + price[1] + '</span>'
        +     '</div>'
        +     '<div class="m-stepper">'
        +       minusHtml
        +       '<button class="m-add" type="button" data-add-product="' + p.id + '">'
        +         '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>'
        +       '</button>'
        +     '</div>'
        +   '</div>'
        + '</div>'
        + '</article>';
    }).join("");
  }

  function renderSidebar() {
    var sideList = document.querySelector(".ms-list");
    if (!sideList || allCategories.length === 0) return;
    sideList.innerHTML = allCategories.map(function (cat, i) {
      return '<li class="ms-item' + (i === 0 ? ' is-active' : '') + '" data-cat-id="' + cat.id + '">'
        + '<span class="ms-label">' + escape(cat.name) + '</span></li>';
    }).join("");
    sideList.querySelectorAll(".ms-item").forEach(function (item) {
      item.addEventListener("click", function () {
        sideList.querySelectorAll(".ms-item").forEach(function (n) { n.classList.remove("is-active"); });
        item.classList.add("is-active");
        var catId = item.dataset.catId;
        currentCatId = catId;
        var cat = allCategories.find(function (c) { return String(c.id) === catId; });
        if (catHead) catHead.textContent = cat ? cat.name : "";
        renderProducts(allProducts.filter(function (p) { return String(p.categoryId) === catId; }));
      });
    });
  }

  function updateCartBar() {
    var qty = cartSummary.totalQuantity || 0;
    if (cartCountNode) {
      cartCountNode.textContent = String(qty);
      cartCountNode.style.display = qty > 0 ? "" : "none";
    }
    if (cartEmptyText) cartEmptyText.style.display = qty > 0 ? "none" : "";
    if (cartTotal) {
      cartTotal.style.display = qty > 0 ? "" : "none";
      cartTotal.textContent = "¥" + (cartSummary.totalAmount || 0).toFixed(1);
    }
    if (cartGo) cartGo.classList.toggle("is-disabled", qty <= 0);
    renderDrawer();
  }

  var currentCatId = "";

  function rerenderCurrentCat() {
    var filtered = currentCatId ? allProducts.filter(function (p) { return String(p.categoryId) === String(currentCatId); }) : allProducts;
    renderProducts(filtered);
  }

  if (menuList) {
    menuList.addEventListener("click", function (e) {
      var addBtn = e.target.closest("[data-add-product]");
      var minusBtn = e.target.closest("[data-minus-product]");

      if (addBtn) {
        // 点 + 跳详情页让用户选规格,而不是直接按"标准杯"加购
        e.preventDefault();
        window.location.href = "detail.html?id=" + encodeURIComponent(addBtn.dataset.addProduct);
        return;
      }

      if (minusBtn) {
        if (!app || !app.isLoggedIn || !app.isLoggedIn()) return;
        var productId = minusBtn.dataset.minusProduct;
        var cartItem = (cartSummary.items || []).find(function (ci) { return ci.productId === productId; });
        if (!cartItem) return;
        minusBtn.disabled = true;
        var promise = cartItem.quantity <= 1
          ? app.del("/cart/items/" + cartItem.id)
          : app.patch("/cart/items/" + cartItem.id, { quantity: cartItem.quantity - 1 });
        promise
          .then(function (data) { cartSummary = data || cartSummary; updateCartBar(); rerenderCurrentCat(); })
          .catch(function (err) { if (app.showMessage) app.showMessage(err.message); })
          .finally(function () { minusBtn.disabled = false; });
      }
    });
  }

  if (app && app.isLoggedIn && app.isLoggedIn()) {
    app.get("/cart")
      .then(function (data) { cartSummary = data || cartSummary; updateCartBar(); })
      .catch(function () {});
  }

  Promise.all([
    app.get("/categories"),
    app.get("/products")
  ]).then(function (res) {
    allCategories = res[0] || [];
    allProducts = res[1] || [];
    renderSidebar();
    if (allCategories.length > 0) {
      currentCatId = String(allCategories[0].id);
      if (catHead) catHead.textContent = allCategories[0].name;
      renderProducts(allProducts.filter(function (p) { return String(p.categoryId) === currentCatId; }));
    } else {
      renderProducts(allProducts);
    }
  }).catch(function () {});

  updateCartBar();

  /* ====== 优惠券浮按钮 + 抽屉 ====== */
  var couponCountNode = document.querySelector("[data-coupon-count]");
  var couponToggle = document.querySelector("[data-coupon-toggle]");
  var couponMask = document.querySelector("[data-coupon-mask]");
  var couponDrawer = document.querySelector("[data-coupon-drawer]");
  var couponListNode = document.querySelector("[data-coupon-list]");
  var couponClose = document.querySelector("[data-coupon-close]");
  var myCoupons = [];

  function loadMyCoupons() {
    if (!app || !app.isLoggedIn || !app.isLoggedIn() || !app.get) return;
    app.get("/user/coupons").then(function (list) {
      myCoupons = (list || []).filter(function (c) { return c.status === "AVAILABLE" || !c.status; });
      if (couponCountNode) couponCountNode.textContent = String(myCoupons.length);
      renderMyCoupons();
    }).catch(function () {});
  }
  function renderMyCoupons() {
    if (!couponListNode) return;
    if (myCoupons.length === 0) {
      couponListNode.innerHTML = '<p class="cd-empty">还没领过优惠券,去省钱卡领一张</p>';
      return;
    }
    couponListNode.innerHTML = myCoupons.map(function (c) {
      var title = escape(c.title || "优惠券");
      var cond = escape(c.conditionText || ("满 ¥" + (c.conditionAmount || 0) + " 减 ¥" + (c.discountAmount || 0)));
      return '<div class="my-coupon">'
        + '<div class="mc-amount"><span class="mc-yuan">¥</span><span class="mc-int">' + (c.discountAmount || 0) + '</span></div>'
        + '<div class="mc-body"><div class="mc-title">' + title + '</div><div class="mc-cond">' + cond + '</div></div>'
      + '</div>';
    }).join("");
  }
  function openCouponDrawer() {
    if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
      if (app && app.showMessage) app.showMessage("请先登录后查看优惠券");
      return;
    }
    if (couponDrawer) couponDrawer.classList.add("is-open");
    if (couponMask) couponMask.classList.add("is-open");
  }
  function closeCouponDrawer() {
    if (couponDrawer) couponDrawer.classList.remove("is-open");
    if (couponMask) couponMask.classList.remove("is-open");
  }
  if (couponToggle) couponToggle.addEventListener("click", openCouponDrawer);
  if (couponMask) couponMask.addEventListener("click", closeCouponDrawer);
  if (couponClose) couponClose.addEventListener("click", closeCouponDrawer);

  loadMyCoupons();

  /* ====== 搜索 overlay ====== */
  var searchBtn = document.querySelector(".mh-icon-btn");
  var searchOverlay = document.querySelector("[data-search-overlay]");
  var searchInput = document.querySelector("[data-search-input]");
  var searchCancel = document.querySelector("[data-search-cancel]");
  var searchResults = document.querySelector("[data-search-results]");

  function openSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.add("is-open");
    if (searchInput) { searchInput.value = ""; setTimeout(function () { searchInput.focus(); }, 100); }
    renderSearch("");
  }
  function closeSearch() {
    if (searchOverlay) searchOverlay.classList.remove("is-open");
  }
  function renderSearch(keyword) {
    if (!searchResults) return;
    var kw = (keyword || "").trim().toLowerCase();
    if (!kw) {
      searchResults.innerHTML = '<p class="so-empty">输入关键字搜索商品</p>';
      return;
    }
    var hits = allProducts.filter(function (p) {
      var name = (p.name || "").toLowerCase();
      var desc = (p.description || "").toLowerCase();
      return name.indexOf(kw) >= 0 || desc.indexOf(kw) >= 0;
    });
    if (hits.length === 0) {
      searchResults.innerHTML = '<p class="so-empty">没找到相关商品</p>';
      return;
    }
    searchResults.innerHTML = hits.map(function (p) {
      var price = Number(p.price || 0).toFixed(1);
      return '<a class="so-item" href="detail.html?id=' + encodeURIComponent(p.id) + '">'
        + '<img class="so-thumb" src="' + app.imageUrl(p.image) + '" onerror="this.src=\'images/common/food-placeholder.svg\'">'
        + '<div class="so-body"><div class="so-name">' + escape(p.name) + '</div><div class="so-desc">' + escape(p.description) + '</div></div>'
        + '<div class="so-price">¥' + price + '</div>'
      + '</a>';
    }).join("");
  }
  if (searchBtn) searchBtn.addEventListener("click", openSearch);
  if (searchCancel) searchCancel.addEventListener("click", closeSearch);
  if (searchInput) searchInput.addEventListener("input", function () { renderSearch(searchInput.value); });
});
