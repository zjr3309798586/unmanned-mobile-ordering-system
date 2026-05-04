(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function showToast(message) {
    var toast = $(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message || "操作成功，当前为静态演示";
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 1800);
  }

  function initNav() {
    var page = document.body.getAttribute("data-page");
    if (!page) {
      return;
    }
    $all(".nav-item").forEach(function (item) {
      if (item.getAttribute("data-page") === page) {
        item.classList.add("active");
      }
    });
  }

  function initLogin() {
    var form = $("#loginForm");
    if (!form) {
      return;
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      localStorage.setItem("umo-admin-login", "true");
      window.location.href = "dashboard.html";
    });
  }

  function initSearch() {
    $all("[data-table-search]").forEach(function (input) {
      var table = $(input.getAttribute("data-table-search"));
      if (!table) {
        return;
      }
      input.addEventListener("input", function () {
        var keyword = input.value.trim().toLowerCase();
        $all("tbody tr", table).forEach(function (row) {
          row.style.display = row.textContent.toLowerCase().indexOf(keyword) >= 0 ? "" : "none";
        });
      });
    });
  }

  function initTabs() {
    $all("[data-status-filter]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var status = tab.getAttribute("data-status-filter");
        var target = $(tab.getAttribute("data-target"));
        $all(".tab", tab.parentElement).forEach(function (item) {
          item.classList.remove("active");
        });
        tab.classList.add("active");
        if (!target) {
          return;
        }
        $all("tbody tr", target).forEach(function (row) {
          row.style.display = status === "all" || row.getAttribute("data-status") === status ? "" : "none";
        });
      });
    });
  }

  function initButtons() {
    $all("[data-toast]").forEach(function (button) {
      button.addEventListener("click", function () {
        showToast(button.getAttribute("data-toast"));
      });
    });

    var logout = $("#logoutBtn");
    if (logout) {
      logout.addEventListener("click", function () {
        localStorage.removeItem("umo-admin-login");
        window.location.href = "login.html";
      });
    }

    var menuToggle = $("#menuToggle");
    var sidebar = $("#sidebar");
    if (menuToggle && sidebar) {
      menuToggle.addEventListener("click", function () {
        sidebar.classList.toggle("open");
      });
    }
  }

  function initDate() {
    var date = $(".js-date");
    if (date) {
      date.textContent = new Date().toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initLogin();
    initSearch();
    initTabs();
    initButtons();
    initDate();
  });
})();
