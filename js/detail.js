document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var productId = app.queryParam("id");
  var product = null;
  var price = parseFloat(document.body.dataset.unitPrice || "0");
  var quantity = 1;
  var coverNode = document.querySelector(".detail-cover");
  var titleNode = document.querySelector(".section-title");
  var noteNode = document.querySelector(".section-note");
  var descNode = document.querySelector(".product-desc");
  var priceNode = document.querySelector(".detail-price-line .price");
  var qtyNode = document.querySelector("[data-detail-qty]");
  var countNode = document.querySelector("[data-detail-count]");
  var totalNode = document.querySelector("[data-detail-total]");
  var minusButton = document.querySelector("[data-detail-minus]");
  var plusButton = document.querySelector("[data-detail-plus]");
  var addCartButton = document.querySelector(".detail-action-bar .button-secondary");
  var buyButton = document.querySelector(".detail-action-bar .button-primary");
  var textBlockNode = document.querySelector(".text-block");

  function render() {
    if (qtyNode) {
      qtyNode.textContent = String(quantity);
    }
    if (countNode) {
      countNode.textContent = String(quantity);
    }
    if (totalNode) {
      totalNode.textContent = app.money(price * quantity);
    }
  }

  function renderProduct(data) {
    product = data;
    productId = product.id;
    price = Number(product.price || 0);
    document.body.dataset.unitPrice = String(price);

    if (coverNode) {
      coverNode.src = app.imageUrl(product.image);
      coverNode.alt = product.name;
      coverNode.onerror = function () {
        coverNode.src = "images/food-placeholder.svg";
      };
    }
    if (titleNode) {
      titleNode.textContent = product.name;
    }
    if (noteNode) {
      noteNode.textContent = "月售 " + (product.sales || 0) + " 杯，数据来自后端商品接口";
    }
    if (descNode) {
      descNode.textContent = product.description || "";
    }
    if (textBlockNode) {
      textBlockNode.innerHTML = '<p>' + app.escapeHtml(product.description || "暂无更多商品说明。") + '</p>' +
        '<p>当前商品支持温度、甜度和加料选择，加入购物车后会按所选规格保存。</p>';
    }
    if (priceNode) {
      priceNode.textContent = app.money(price);
    }
    render();
  }

  function selectedSpec() {
    var specs = [];
    document.querySelectorAll("[data-choice-group]").forEach(function (group) {
      group.querySelectorAll("[data-choice].is-active").forEach(function (choice) {
        specs.push(choice.textContent.trim());
      });
    });
    return specs.length ? specs.join(" / ") : app.defaultSpec;
  }

  function addToCart(redirectUrl) {
    if (!productId) {
      app.showMessage("商品数据未加载完成");
      return;
    }
    app.post("/cart/items", {
      productId: productId,
      spec: selectedSpec(),
      quantity: quantity
    }).then(function () {
      app.showMessage("已加入购物车");
      if (redirectUrl) {
        window.setTimeout(function () {
          window.location.href = redirectUrl;
        }, 450);
      }
    }).catch(function (error) {
      app.showMessage(error.message);
    });
  }

  if (minusButton) {
    minusButton.addEventListener("click", function () {
      if (quantity > 1) {
        quantity -= 1;
        render();
      }
    });
  }

  if (plusButton) {
    plusButton.addEventListener("click", function () {
      quantity += 1;
      render();
    });
  }

  if (addCartButton) {
    addCartButton.addEventListener("click", function (event) {
      event.preventDefault();
      addToCart("cart.html");
    });
  }

  if (buyButton) {
    buyButton.addEventListener("click", function (event) {
      event.preventDefault();
      addToCart("submit-order.html");
    });
  }

  if (productId) {
    app.get("/products/" + encodeURIComponent(productId))
      .then(renderProduct)
      .catch(function (error) {
        app.showMessage(error.message);
      });
  } else {
    app.get("/products")
      .then(function (products) {
        if (products && products.length) {
          renderProduct(products[0]);
        }
      })
      .catch(function (error) {
        app.showMessage(error.message);
      });
  }

  render();
});
