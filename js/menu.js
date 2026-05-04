document.addEventListener("DOMContentLoaded", function () {
  var total = 0;
  var count = 0;
  var itemCounts = {};
  var totalNode = document.querySelector("[data-cart-total]");
  var countNode = document.querySelector("[data-cart-count]");
  var settlementBar = document.querySelector("[data-settlement-bar]");

  function renderCartSummary() {
    if (totalNode) {
      totalNode.textContent = "¥ " + total.toFixed(2);
    }
    if (countNode) {
      countNode.textContent = String(count);
    }

    document.querySelectorAll("[data-count-for]").forEach(function (counter) {
      var key = counter.dataset.countFor;
      counter.textContent = String(itemCounts[key] || 0);
    });

    if (settlementBar) {
      settlementBar.classList.toggle("is-hidden", count === 0);
      settlementBar.classList.toggle("is-visible", count > 0);
    }
  }

  document.querySelectorAll("[data-category]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll("[data-category]").forEach(function (item) {
        item.classList.remove("is-active");
      });
      button.classList.add("is-active");

      var targetId = button.dataset.targetId;
      var targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  document.querySelectorAll("[data-add-item]").forEach(function (button) {
    button.addEventListener("click", function () {
      var key = button.dataset.addItem;
      var price = parseFloat(button.dataset.price || "0");

      itemCounts[key] = (itemCounts[key] || 0) + 1;
      count += 1;
      total += price;
      button.classList.add("is-bumped");
      window.setTimeout(function () {
        button.classList.remove("is-bumped");
      }, 180);
      renderCartSummary();
    });
  });

  renderCartSummary();
});
