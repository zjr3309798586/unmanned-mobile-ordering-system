document.addEventListener("DOMContentLoaded", function () {
  var tabs = document.querySelectorAll("[data-order-filter]");
  var cards = document.querySelectorAll("[data-order-type]");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var filter = tab.dataset.orderFilter;
      tabs.forEach(function (item) {
        item.classList.remove("is-active");
      });
      tab.classList.add("is-active");

      cards.forEach(function (card) {
        var type = card.dataset.orderType;
        var show = filter === "all" || filter === type;
        card.style.display = show ? "block" : "none";
      });
    });
  });

  document.querySelectorAll("[data-order-action]").forEach(function (button) {
    button.addEventListener("click", function () {
      var action = button.dataset.orderAction;
      var card = button.closest(".order-card");
      var statusNode = card ? card.querySelector(".status-pill") : null;

      if (!statusNode) {
        return;
      }

      if (action === "cancel") {
        statusNode.textContent = "已取消";
        button.textContent = "已取消";
      }

      if (action === "refund") {
        statusNode.textContent = "退单处理中";
        button.textContent = "处理中";
      }
    });
  });
});
