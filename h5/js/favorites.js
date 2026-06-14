document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var listNode = document.querySelector("[data-favorites-list]");
  var emptyNode = document.querySelector("[data-favorites-empty]");
  var loadingNode = document.querySelector("[data-favorites-loading]");
  var countNode = document.querySelector("[data-favorites-count]");
  var FAV_KEY = "orderingFavorites";

  function setLoading(on) {
    if (loadingNode) {
      loadingNode.style.display = on ? "block" : "none";
    }
  }

  function setCount(count) {
    if (countNode) {
      countNode.textContent = count ? "共 " + count + " 件常点商品" : "还没有收藏商品";
    }
  }

  function readLocalFavoriteIds() {
    try {
      var ids = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      return Array.isArray(ids) ? ids.filter(Boolean) : [];
    } catch (error) {
      return [];
    }
  }

  function clearLocalFavoriteIds() {
    try { localStorage.removeItem(FAV_KEY); } catch (error) {}
  }

  function ensureLogin() {
    if (!app || !app.isLoggedIn) {
      return Promise.reject(new Error("页面初始化失败"));
    }
    if (app.isLoggedIn()) {
      return Promise.resolve();
    }
    if (app.devLogin) {
      return app.devLogin("游客用户");
    }
    return Promise.reject(new Error("请先登录"));
  }

  function migrateLocalFavorites() {
    var ids = readLocalFavoriteIds();
    if (!ids.length || !app || !app.post) {
      return Promise.resolve();
    }
    return Promise.all(ids.map(function (id) {
      return app.post("/favorites/" + encodeURIComponent(id), {}).catch(function () {
        return null;
      });
    })).then(function () {
      clearLocalFavoriteIds();
    });
  }

  function productTags(product) {
    if (Array.isArray(product.tags) && product.tags.length) {
      return product.tags.slice(0, 2);
    }
    return ["常点口味", "可复购"];
  }

  function productCard(product) {
    var tags = productTags(product).map(function (tag) {
      return "<span>" + app.escapeHtml(tag) + "</span>";
    }).join("");
    return [
      '<article class="fav-product" data-product-id="' + app.escapeHtml(product.id) + '">',
      '  <img class="fav-product-img" src="' + app.escapeHtml(app.imageUrl(product.image)) + '" alt="' + app.escapeHtml(product.name) + '">',
      '  <div class="fav-product-main">',
      '    <h3 class="fav-product-name">' + app.escapeHtml(product.name) + '</h3>',
      '    <p class="fav-product-desc">' + app.escapeHtml(product.description || "清爽好喝，适合日常复购") + '</p>',
      '    <div class="fav-product-tags">' + tags + '</div>',
      '    <div class="fav-product-foot">',
      '      <span class="fav-product-price">' + app.money(product.price).replace(".00", "") + '</span>',
      '      <div class="fav-actions">',
      '        <a class="fav-reorder" href="detail.html?id=' + encodeURIComponent(product.id) + '">再点一杯</a>',
      '        <button class="fav-remove" type="button" data-remove-favorite="' + app.escapeHtml(product.id) + '">取消</button>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</article>'
    ].join("");
  }

  function render(products) {
    var list = Array.isArray(products) ? products : [];
    setCount(list.length);
    if (!list.length) {
      if (listNode) listNode.innerHTML = "";
      if (emptyNode) emptyNode.hidden = false;
      return;
    }
    if (emptyNode) emptyNode.hidden = true;
    if (listNode) {
      listNode.innerHTML = list.map(productCard).join("");
    }
  }

  function loadFavorites() {
    setLoading(true);
    return app.get("/favorites")
      .then(render)
      .catch(function (error) {
        render([]);
        if (app.showMessage) app.showMessage(error.message || "收藏加载失败");
      })
      .finally(function () {
        setLoading(false);
      });
  }

  if (listNode) {
    listNode.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-remove-favorite]");
      if (!btn) return;
      var id = btn.dataset.removeFavorite;
      btn.disabled = true;
      app.del("/favorites/" + encodeURIComponent(id))
        .then(function (products) {
          if (app.showMessage) app.showMessage("已取消收藏");
          render(products);
        })
        .catch(function (error) {
          if (app.showMessage) app.showMessage(error.message || "取消失败");
        })
        .finally(function () {
          btn.disabled = false;
        });
    });
  }

  if (!app || !app.get || !app.del || !app.escapeHtml) {
    setLoading(false);
    render([]);
    return;
  }

  ensureLogin()
    .then(migrateLocalFavorites)
    .then(loadFavorites)
    .catch(function (error) {
      setLoading(false);
      render([]);
      if (app.showMessage) app.showMessage(error.message || "请先登录");
    });
});
