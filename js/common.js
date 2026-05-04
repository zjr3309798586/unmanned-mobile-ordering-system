document.addEventListener("DOMContentLoaded", function () {
  var currentPage = document.body.dataset.page || "";
  var navPageMap = {
    detail: "menu",
    cart: "menu",
    "submit-order": "menu"
  };
  var activeKey = navPageMap[currentPage] || currentPage;

  document.querySelectorAll("[data-nav-key]").forEach(function (item) {
    item.classList.toggle("is-active", item.dataset.navKey === activeKey);
  });

  document.querySelectorAll("[data-choice-group]").forEach(function (group) {
    group.addEventListener("click", function (event) {
      var target = event.target.closest("[data-choice]");
      if (!target) {
        return;
      }

      if (group.dataset.multi === "true") {
        target.classList.toggle("is-active");
        return;
      }

      group.querySelectorAll("[data-choice]").forEach(function (item) {
        item.classList.remove("is-active");
      });
      target.classList.add("is-active");
    });
  });
});
