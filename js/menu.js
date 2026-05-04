document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var categories = [];
  var products = [];
  var cartSummary = { items: [], totalQuantity: 0, totalAmount: 0 };
  var activeCategory = "all";
  var categoryList = document.querySelector(".category-list");
  var menuContent = document.querySelector(".menu-content");
  var searchInput = document.querySelector(".search-input");
  var totalNode = document.querySelector("[data-cart-total]");
  var countNode = document.querySelector("[data-cart-count]");
  var settlementBar = document.querySelector("[data-settlement-bar]");

  function renderLoading() {
    if (categoryList) {
      categoryList.innerHTML = '<button class="category-button is-active" type="button">加载中</button>';
    }
    if (menuContent) {
      menuContent.innerHTML = '<section class="section-card menu-group"><p class="section-note">正在从后端读取商品...</p></section>';
    }
  }

  function renderCategories() {
    if (!categoryList) {
      return;
    }
    var html = '<button class="category-button ' + (activeCategory === "all" ? "is-active" : "") + '" type="button" data-category-id="all">全部商品</button>';
    html += categories.map(function (category) {
      return '<button class="category-button ' + (activeCategory === category.id ? "is-active" : "") + '" type="button" data-category-id="' + app.escapeHtml(category.id) + '">' + app.escapeHtml(category.name) + '</button>';
    }).join("");
    categoryList.innerHTML = html;
  }

  function getVisibleProducts() {
    var keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    return products.filter(function (product) {
      var description = product.description || "";
      var matchCategory = activeCategory === "all" || product.categoryId === activeCategory;
      var matchKeyword = !keyword
        || product.name.toLowerCase().indexOf(keyword) >= 0
        || description.toLowerCase().indexOf(keyword) >= 0;
      return matchCategory && matchKeyword;
    });
  }

  function renderProducts() {
    if (!menuContent) {
      return;
    }
    var visible = getVisibleProducts();
    if (visible.length === 0) {
      menuContent.innerHTML = '<section class="section-card menu-group"><p class="section-note">暂无匹配商品，请换个关键词试试。</p></section>';
      return;
    }

    var categoryMap = {};
    categories.forEach(function (category) {
      categoryMap[category.id] = category.name;
    });

    var grouped = {};
    visible.forEach(function (product) {
      var key = product.categoryId || "other";
      grouped[key] = grouped[key] || [];
      grouped[key].push(product);
    });

    menuContent.innerHTML = Object.keys(grouped).map(function (categoryId) {
      var title = activeCategory === "all" ? (categoryMap[categoryId] || "其他商品") : (categoryMap[categoryId] || "商品列表");
      return '<section class="section-card menu-group" id="group-' + app.escapeHtml(categoryId) + '">' +
        '<div class="section-head"><div><h2 class="section-title">' + app.escapeHtml(title) + '</h2><p class="section-note">数据来自 Spring Boot 后端接口</p></div></div>' +
        '<div class="menu-item-list">' + grouped[categoryId].map(renderProductCard).join("") + '</div>' +
      '</section>';
    }).join("");
    renderCartSummary();
  }

  function renderProductCard(product) {
    var tags = (product.tags || []).slice(0, 2).map(function (tag) {
      return '<span class="tag">' + app.escapeHtml(tag) + '</span>';
    }).join("");
    return '<article class="menu-item-card">' +
      '<img class="cover-thumb" src="' + app.imageUrl(product.image) + '" alt="' + app.escapeHtml(product.name) + '" onerror="this.src=\'images/food-placeholder.svg\'">' +
      '<div class="product-body">' +
        '<div class="tag-row">' + tags + '</div>' +
        '<h3 class="product-name"><a class="plain-link" href="detail.html?id=' + encodeURIComponent(product.id) + '">' + app.escapeHtml(product.name) + '</a></h3>' +
        '<p class="product-desc">' + app.escapeHtml(product.description) + '</p>' +
        '<div class="price-line">' +
          '<strong class="price">' + app.money(product.price) + '</strong>' +
          '<div class="menu-item-action">' +
            '<span class="item-counter" data-count-for="' + app.escapeHtml(product.id) + '">0</span>' +
            '<button class="add-button" type="button" data-add-product="' + app.escapeHtml(product.id) + '">+</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderCartSummary() {
    var productCountMap = {};
    (cartSummary.items || []).forEach(function (item) {
      productCountMap[item.productId] = (productCountMap[item.productId] || 0) + item.quantity;
    });

    document.querySelectorAll("[data-count-for]").forEach(function (counter) {
      counter.textContent = String(productCountMap[counter.dataset.countFor] || 0);
    });
    if (totalNode) {
      totalNode.textContent = app.money(cartSummary.totalAmount);
    }
    if (countNode) {
      countNode.textContent = String(cartSummary.totalQuantity || 0);
    }
    if (settlementBar) {
      settlementBar.classList.toggle("is-hidden", !cartSummary.totalQuantity);
      settlementBar.classList.toggle("is-visible", !!cartSummary.totalQuantity);
    }
  }

  if (categoryList) {
    categoryList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-category-id]");
      if (!button) {
        return;
      }
      activeCategory = button.dataset.categoryId;
      renderCategories();
      renderProducts();
    });
  }

  if (menuContent) {
    menuContent.addEventListener("click", function (event) {
      var button = event.target.closest("[data-add-product]");
      if (!button) {
        return;
      }
      button.disabled = true;
      app.post("/cart/items", {
        productId: button.dataset.addProduct,
        spec: "Regular",
        quantity: 1
      }).then(function (data) {
        cartSummary = data;
        button.classList.add("is-bumped");
        window.setTimeout(function () {
          button.classList.remove("is-bumped");
        }, 180);
        renderCartSummary();
        app.showMessage("已加入购物车");
      }).catch(function (error) {
        app.showMessage(error.message);
      }).finally(function () {
        button.disabled = false;
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", renderProducts);
  }

  if (searchInput && app.queryParam("keyword")) {
    searchInput.value = app.queryParam("keyword");
  }

  renderLoading();
  Promise.all([app.get("/categories"), app.get("/products"), app.get("/cart")])
    .then(function (result) {
      categories = result[0] || [];
      products = result[1] || [];
      cartSummary = result[2] || cartSummary;
      renderCategories();
      renderProducts();
      renderCartSummary();
    })
    .catch(function (error) {
      if (menuContent) {
        menuContent.innerHTML = '<section class="section-card menu-group"><p class="section-note">后端接口连接失败：' + app.escapeHtml(error.message) + '</p></section>';
      }
    });
});
