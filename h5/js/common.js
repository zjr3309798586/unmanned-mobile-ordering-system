/**
 * H5 公共基础库 —— 挂载到 window.OrderingApp 全局命名空间。
 *
 * 所有页面(cart/menu/detail/mine/order/saving-card/index)都依赖这个库。
 *
 * 提供能力:
 *   1. HTTP 请求封装(get/post/patch/del),自动带 token + 统一错误处理
 *   2. 登录态管理(读/写 localStorage 里的 token 与 session)
 *   3. 工具函数:money / specText / imageUrl / escapeHtml / statusText / pickupTypeText
 *   4. 全局 Toast 提示(showMessage)
 *   5. URL 查询参数读取(queryParam)
 *   6. 底部导航高亮、四选一/多选 UI 组件(DOMContentLoaded 里初始化)
 */
window.OrderingApp = (function () {
  // 默认 API 基址:用 file:// 打开 html 时连 127.0.0.1:8080(开发态),
  // 通过 8080 端口访问时直接用同源 + /api。
  var defaultApiBaseUrl = window.location.protocol === "file:"
    ? "http://127.0.0.1:8080/api"
    : window.location.origin + "/api";

  // 允许通过 localStorage.orderingApiBaseUrl 覆盖默认值(测试不同后端时方便)
  var apiBaseUrl = localStorage.getItem("orderingApiBaseUrl") || defaultApiBaseUrl;

  // 登录状态:token 字符串 + 完整 session 对象。一开始从 localStorage 读出来,刷新页面仍保留登录。
  var userToken = localStorage.getItem("orderingUserToken") || "";
  var userSession = null;
  try {
    userSession = JSON.parse(localStorage.getItem("orderingUserSession") || "null");
  } catch (error) {
    // localStorage 里的 session 不是合法 JSON(被人手改过) → 当作未登录
    userSession = null;
  }

  /**
   * 统一 HTTP 请求封装。
   * - 自动加 Content-Type: application/json
   * - 已登录时自动带 X-User-Token 请求头
   * - body 是对象时自动 JSON.stringify
   * - 服务端返回 { success: false, message: ... } 时统一抛 Error,业务代码用 .catch 接收
   */
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
          // 失败有两种情况:HTTP 4xx/5xx,或者 HTTP 200 但 payload.success === false
          if (!response.ok || payload.success === false) {
            throw new Error(payload.message || "接口请求失败");
          }
          // 成功时只 resolve 业务 data,外层不用关心 success/code/message 这层包装
          return payload.data;
        });
      });
  }

  /** 金额格式化:0 → "¥ 0.00"; 13.9 → "¥ 13.90"。 */
  function money(value) {
    return "¥ " + Number(value || 0).toFixed(2);
  }

  // 商品默认规格(用户没选时的兜底文案)
  var defaultSpec = "标准杯 / 常温 / 正常糖";

  /** 规格文案兜底:数据库里历史商品的 "Regular" 显示成中文默认规格。 */
  function specText(value) {
    if (!value || value === "Regular") {
      return defaultSpec;
    }
    return value;
  }

  var imageDirs = ["nav", "home", "menu", "mine", "saving", "mascot", "common", "icons", "uploads"];
  var assetPrefix = window.location.protocol === "file:" ? "../" : "";

  function assetPath(path) {
    return assetPrefix + path;
  }

  function guessImageSubdir(filename) {
    if (/^nav-/.test(filename)) return "nav";
    if (/^home-/.test(filename)) return "home";
    if (/^menu-product-/.test(filename)) return "menu";
    if (/^product-/.test(filename)) return "menu";
    if (/^mine-/.test(filename)) return "mine";
    if (/^saving-/.test(filename)) return "saving";
    if (/^icon-(delivery|pickup)-/.test(filename)) return "saving";
    if (/^mascot-yunbao/.test(filename)) return "mascot";
    if (/-placeholder\.svg$/.test(filename)) return "common";
    return null;
  }

  /**
   * 图片路径转换:兼容数据库里的旧扁平路径(/images/product-x.svg),
   * 自动映射到当前整理后的图片目录(images/menu/product-x.svg)。
   */
  function imageUrl(value) {
    var fallback = assetPath("images/common/food-placeholder.svg");
    if (!value) {
      return fallback;
    }
    if (value.indexOf("/images/") === 0) {
      var rest = value.substring("/images/".length);
      var head = rest.split("/")[0];
      if (imageDirs.indexOf(head) !== -1) {
        return assetPath("images/" + rest);
      }
      var filename = rest.split("/").pop();
      var subdir = guessImageSubdir(filename);
      return subdir ? assetPath("images/" + subdir + "/" + filename) : fallback;
    }
    if (window.location.protocol === "file:" && value.indexOf("images/") === 0) {
      return assetPath(value);
    }
    return value;
  }

  /**
   * HTML 转义,防 XSS。
   * 把外部数据(用户昵称、商品名、备注等)拼到 innerHTML 前必须先调一次。
   */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** 订单状态英文 → 中文。后端状态码到 UI 文案的映射。 */
  function statusText(status) {
    var map = {
      MAKING: "制作中",
      WAITING_PICKUP: "待取餐",
      DELIVERING: "配送中",
      COMPLETED: "已完成",
      CANCELED: "已取消"
    };
    return map[status] || status || "未知";
  }

  /** 取餐方式英文 → 中文。 */
  function pickupTypeText(type) {
    var map = {
      SELF_PICKUP: "到店自取",
      DINE_IN: "堂食",
      DELIVERY: "平台外送"
    };
    return map[type] || type || "到店自取";
  }

  /**
   * 全局 Toast 提示。
   * - 单例:多次调用复用同一个 DOM 节点(避免叠 10 个 toast 在屏幕上)
   * - 1800ms 后自动消失
   * - 用 inline style 而非 CSS class,这样没引入 common.css 的页面也能正常用
   */
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
    // 防抖:连续调用以最后一次为准,不会被前次 timer 提前关掉
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(function () {
      node.style.display = "none";
    }, 1800);
  }

  /** 取 URL query 参数。例如 ?id=P-1001 → queryParam("id") → "P-1001"。 */
  function queryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /**
   * 写登录状态 —— 登录 / 退出登录时都会调。
   * session 非空 → 写入 token 和 session 到 localStorage,后续请求自动带 token。
   * session 为空 → 清空,等于退出登录。
   */
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

  /** 游客登录(H5 开发用),拿到 token 后立即写入本地。 */
  function devLogin(nickname) {
    return request("/auth/dev-login", {
      method: "POST",
        body: { nickname: nickname || "游客用户" }
    }).then(function (session) {
      setUserSession(session);
      return session;
    });
  }

  /**
   * 退出登录:即使后端接口失败也强制清本地态。
   * 这样断网时用户还是能"退出登录",不至于卡在登录态出不来。
   */
  function logout() {
    return request("/auth/logout", { method: "POST" })
      .catch(function () {
        return null;
      })
      .then(function () {
        setUserSession(null);
      });
  }

  // 对外暴露的 API。其他页面通过 window.OrderingApp.xxx 调用。
  return {
    apiBaseUrl: apiBaseUrl,
    get: function (path) {
      return request(path);
    },
    post: function (path, body) {
      return request(path, { method: "POST", body: body });
    },
    put: function (path, body) {
      return request(path, { method: "PUT", body: body });
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

// ===== 页面初始化(所有页加载时都跑一次) =====
document.addEventListener("DOMContentLoaded", function () {
  // 不再自动 devLogin —— 之前的版本会自动创建游客用户,导致"只能退出不能登录"问题。
  // 现在让 mine 页登录入口、cart 加购流程按需触发登录。

  // 当前页对应的导航高亮。
  // detail/cart 都属于"点餐"流程,共用 menu 高亮。
  var currentPage = document.body.dataset.page || "";
  var navPageMap = {
    detail: "menu",
    cart: "menu",
    address: "mine",
    favorites: "mine",
    support: "mine"
  };
  var activeKey = navPageMap[currentPage] || currentPage;

  document.querySelectorAll("[data-nav-key]").forEach(function (item) {
    item.classList.toggle("is-active", item.dataset.navKey === activeKey);
  });

  // 通用"四选一 / 多选"组件。
  // 用法:在 <div data-choice-group> 内放若干 <div data-choice>,点击切换激活态。
  // 加 data-multi="true" 后改为多选(每项独立 toggle)。
  // 用于 detail 页选规格 / 温度 / 糖度等。
  document.querySelectorAll("[data-choice-group]").forEach(function (group) {
    group.addEventListener("click", function (event) {
      var target = event.target.closest("[data-choice]");
      if (!target) {
        return;
      }

      if (group.dataset.multi === "true") {
        // 多选:独立 toggle 每个选项
        target.classList.toggle("is-active");
        return;
      }

      // 单选:先把同组的全部移除激活,再激活点击的这个
      group.querySelectorAll("[data-choice]").forEach(function (item) {
        item.classList.remove("is-active");
      });
      target.classList.add("is-active");
    });
  });
});
