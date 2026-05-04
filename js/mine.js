document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-service-link]").forEach(function (link) {
    link.addEventListener("click", function () {
      document.querySelectorAll("[data-service-link]").forEach(function (item) {
        item.classList.remove("is-highlight");
      });
      link.classList.add("is-highlight");
    });
  });
});
