window.OrderingApp = (function () {
  var defaultApiBaseUrl = window.location.protocol === "file:"
    ? "http://127.0.0.1:8080/api"
    : window.location.origin + "/api";
  var apiBaseUrl = localStorage.getItem("orderingApiBaseUrl") || defaultApiBaseUrl;
  var userToken = localStorage.getItem("orderingUserToken") || "";
  var userSession = null;
  try {
    userSession = JSON.parse(localStorage.getItem("orderingUserSession") || "null");
  } catch (error) {
    userSession = null;
  }

  function request(path, options) {
    var config = options || {};
    config.headers = Object.assign({ "Content-Type": "application/json" }, config.headers || {});
    if (userToken) {
      config.headers["X-User-Token"] = userToken;
    }

    if (config.body && typeof config.body !== "string") {
      config.body = JSON.stringify(config.body);
    }

    return fetch(apiBaseUrl + path, config)
      .then(function (response) {
        return response.json().then(function (payload) {
          if (!response.ok || payload.success === false) {
            throw new Error(payload.message || "接口请求失败");
          }
          return payload.data;
        });
      });
  }

  function money(value) {
    return "¥ " + Number(value || 0).toFixed(2);
  }

  var defaultSpec = "标准杯 / 常温 / 正常糖";

  function specText(value) {
    if (!value || value === "Regular") {
      return defaultSpec;
    }
    return value;
  }

  function imageUrl(value) {
    if (!value) {
      return "images/common/food-placeholder.svg";
    }
    if (value.indexOf("/images/") === 0) {
      return value.replace("/images/", "images/");
    }
    return value;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function statusText(status) {
    var map = {
      WAITING_PICKUP: "待取餐",
      COMPLETED: "已完成",
      CANCELED: "已取消"
    };
    return map[status] || status || "未知";
  }

  function pickupTypeText(type) {
    var map = {
      SELF_PICKUP: "到店自取",
      DINE_IN: "堂食",
      DELIVERY: "平台外送"
    };
    return map[type] || type || "到店自取";
  }

  function showMessage(message) {
    var node = document.querySelector("[data-page-message]");
    if (!node) {
      node = document.createElement("div");
      node.dataset.pageMessage = "true";
      node.style.cssText = "position:fixed;left:50%;bottom:92px;z-index:50;max-width:360px;padding:10px 14px;border-radius:999px;color:#fff;background:rgba(37,30,24,.92);font-size:13px;transform:translateX(-50%);box-shadow:0 12px 28px rgba(0,0,0,.16);";
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.style.display = "block";
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(function () {
      node.style.display = "none";
    }, 1800);
  }

  function queryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function setUserSession(session) {
    userSession = session || null;
    userToken = session && session.token ? session.token : "";
    if (userToken) {
      localStorage.setItem("orderingUserToken", userToken);
      localStorage.setItem("orderingUserSession", JSON.stringify(userSession));
    } else {
      localStorage.removeItem("orderingUserToken");
      localStorage.removeItem("orderingUserSession");
    }
  }

  function devLogin(nickname) {
    return request("/auth/dev-login", {
      method: "POST",
        body: { nickname: nickname || "游客用户" }
    }).then(function (session) {
      setUserSession(session);
      return session;
    });
  }

  function logout() {
    return request("/auth/logout", { method: "POST" })
      .catch(function () {
        return null;
      })
      .then(function () {
        setUserSession(null);
      });
  }

  return {
    apiBaseUrl: apiBaseUrl,
    get: function (path) {
      return request(path);
    },
    post: function (path, body) {
      return request(path, { method: "POST", body: body });
    },
    patch: function (path, body) {
      return request(path, { method: "PATCH", body: body });
    },
    del: function (path) {
      return request(path, { method: "DELETE" });
    },
    money: money,
    defaultSpec: defaultSpec,
    specText: specText,
    imageUrl: imageUrl,
    escapeHtml: escapeHtml,
    statusText: statusText,
    pickupTypeText: pickupTypeText,
    showMessage: showMessage,
    queryParam: queryParam,
    isLoggedIn: function () {
      return !!userToken;
    },
    getUserSession: function () {
      return userSession;
    },
    setUserSession: setUserSession,
    devLogin: devLogin,
    logout: logout
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  // 不再自动 devLogin,让 mine 页登录入口和加购流程按需触发

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
