document.addEventListener("DOMContentLoaded", function () {
  var price = parseFloat(document.body.dataset.unitPrice || "0");
  var quantity = 1;
  var qtyNode = document.querySelector("[data-detail-qty]");
  var countNode = document.querySelector("[data-detail-count]");
  var totalNode = document.querySelector("[data-detail-total]");
  var minusButton = document.querySelector("[data-detail-minus]");
  var plusButton = document.querySelector("[data-detail-plus]");

  function render() {
    if (qtyNode) {
      qtyNode.textContent = String(quantity);
    }
    if (countNode) {
      countNode.textContent = String(quantity);
    }
    if (totalNode) {
      totalNode.textContent = "¥ " + (price * quantity).toFixed(2);
    }
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

  render();
});
