document.addEventListener("DOMContentLoaded", function () {
  var goodsTotal = 50;
  var discountNode = document.querySelector("[data-submit-discount]");
  var payableNode = document.querySelector("[data-submit-payable]");
  var barPayableNode = document.querySelector("[data-submit-bar-payable]");

  function render(discount) {
    var payable = Math.max(goodsTotal - discount, 0);
    if (discountNode) {
      discountNode.textContent = "- ¥ " + discount.toFixed(2);
    }
    if (payableNode) {
      payableNode.textContent = "¥ " + payable.toFixed(2);
    }
    if (barPayableNode) {
      barPayableNode.textContent = "¥ " + payable.toFixed(2);
    }
  }

  document.querySelectorAll("[data-coupon-option]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll("[data-coupon-option]").forEach(function (item) {
        item.classList.remove("is-active");
      });
      button.classList.add("is-active");
      render(parseFloat(button.dataset.discount || "0"));
    });
  });

  var defaultCoupon = document.querySelector("[data-coupon-option].is-active");
  render(parseFloat((defaultCoupon && defaultCoupon.dataset.discount) || "0"));
});
