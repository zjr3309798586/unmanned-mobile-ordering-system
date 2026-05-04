document.addEventListener("DOMContentLoaded", function () {
  var packagingFee = 2;
  var discountFee = 6;
  var goodsTotalNode = document.querySelector("[data-goods-total]");
  var discountNode = document.querySelector("[data-discount-total]");
  var payNode = document.querySelector("[data-pay-total]");
  var barPayNode = document.querySelector("[data-bar-pay-total]");
  var barCountNode = document.querySelector("[data-bar-item-count]");
  var emptyNode = document.querySelector("[data-cart-empty]");
  var listNode = document.querySelector("[data-cart-list]");

  function getItems() {
    return Array.from(document.querySelectorAll("[data-cart-item]"));
  }

  function updateSummary() {
    var items = getItems();
    var goodsTotal = 0;
    var itemCount = 0;

    items.forEach(function (item) {
      var price = parseFloat(item.dataset.price || "0");
      var qty = parseInt(item.dataset.qty || "1", 10);
      var lineTotal = price * qty;
      goodsTotal += lineTotal;
      itemCount += qty;

      var lineTotalNode = item.querySelector("[data-line-total]");
      var qtyNode = item.querySelector("[data-cart-qty]");
      if (lineTotalNode) {
        lineTotalNode.textContent = "¥ " + lineTotal.toFixed(2);
      }
      if (qtyNode) {
        qtyNode.textContent = String(qty);
      }
    });

    var payable = Math.max(goodsTotal + packagingFee - discountFee, 0);
    if (goodsTotalNode) {
      goodsTotalNode.textContent = "¥ " + goodsTotal.toFixed(2);
    }
    if (discountNode) {
      discountNode.textContent = "- ¥ " + discountFee.toFixed(2);
    }
    if (payNode) {
      payNode.textContent = "¥ " + payable.toFixed(2);
    }
    if (barPayNode) {
      barPayNode.textContent = "¥ " + payable.toFixed(2);
    }
    if (barCountNode) {
      barCountNode.textContent = String(itemCount);
    }

    if (emptyNode && listNode) {
      emptyNode.style.display = items.length === 0 ? "block" : "none";
      listNode.style.display = items.length === 0 ? "none" : "flex";
    }
  }

  document.addEventListener("click", function (event) {
    var minus = event.target.closest("[data-cart-minus]");
    var plus = event.target.closest("[data-cart-plus]");
    var remove = event.target.closest("[data-delete-item]");

    if (minus) {
      var minusItem = minus.closest("[data-cart-item]");
      var minusQty = parseInt(minusItem.dataset.qty || "1", 10);
      if (minusQty > 1) {
        minusItem.dataset.qty = String(minusQty - 1);
        updateSummary();
      }
    }

    if (plus) {
      var plusItem = plus.closest("[data-cart-item]");
      var plusQty = parseInt(plusItem.dataset.qty || "1", 10);
      plusItem.dataset.qty = String(plusQty + 1);
      updateSummary();
    }

    if (remove) {
      var removeItem = remove.closest("[data-cart-item]");
      if (removeItem) {
        removeItem.remove();
        updateSummary();
      }
    }
  });

  updateSummary();
});
