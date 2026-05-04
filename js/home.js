document.addEventListener("DOMContentLoaded", function () {
  var cards = document.querySelectorAll("[data-service-card]");
  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      cards.forEach(function (item) {
        item.classList.remove("is-active");
      });
      card.classList.add("is-active");
    });
  });
});
