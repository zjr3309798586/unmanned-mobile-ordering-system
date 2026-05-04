document.addEventListener("DOMContentLoaded", function () {
  var priceNode = document.querySelector("[data-current-plan-price]");
  var noteNode = document.querySelector("[data-current-plan-note]");

  document.querySelectorAll("[data-plan]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll("[data-plan]").forEach(function (item) {
        item.classList.remove("is-active");
      });
      button.classList.add("is-active");

      if (priceNode) {
        priceNode.textContent = "¥ " + button.dataset.price;
      }
      if (noteNode) {
        noteNode.textContent = button.dataset.note;
      }
    });
  });
});
