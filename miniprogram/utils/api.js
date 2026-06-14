const config = require("./config");
const mockData = config.enableMockFallback ? require("./mock-data") : null;

function getToken() {
  return wx.getStorageSync("userToken") || "";
}

function fallback(path, method, data, reason) {
  if (!config.enableMockFallback || !mockData || !mockData.fallback) {
    return undefined;
  }
  const value = mockData.fallback(path, method, data);
  if (value !== undefined) {
    console.warn("[api-fallback]", method || "GET", path, reason || "");
  }
  return value;
}

function request(path, options = {}) {
  const token = getToken();
  const method = options.method || "GET";
  const data = options.data || {};
  const header = Object.assign({
    "content-type": "application/json"
  }, options.header || {});

  if (token) {
    header["X-User-Token"] = token;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: config.apiBaseUrl + path,
      method,
      data,
      header,
      timeout: options.timeout || config.requestTimeout || 5000,
      success(res) {
        const payload = res.data || {};
        const failed = res.statusCode < 200 || res.statusCode >= 300 || payload.success === false;
        if (failed) {
          const message = payload.message || ("HTTP " + res.statusCode);
          const localValue = fallback(path, method, data, message);
          if (localValue !== undefined) {
            resolve(localValue);
            return;
          }
          reject(new Error(message || "接口请求失败"));
          return;
        }
        resolve(payload.data);
      },
      fail(error) {
        const message = error && error.errMsg ? error.errMsg : "网络连接失败";
        const localValue = fallback(path, method, data, message);
        if (localValue !== undefined) {
          resolve(localValue);
          return;
        }
        reject(new Error(message));
      }
    });
  });
}

const IMG_DIRS = ["nav", "home", "menu", "mine", "saving", "mascot", "common", "icons", "uploads"];

function guessSubdir(filename) {
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

function imageUrl(value) {
  const localFallback = "/images/common/food-placeholder.svg";
  if (!value) return localFallback;
  if (value.indexOf("http://") === 0 || value.indexOf("https://") === 0) {
    return value;
  }
  if (value.indexOf("images/") === 0) {
    return imageUrl("/" + value);
  }
  if (value.indexOf("/images/") === 0) {
    const rest = value.substring("/images/".length);
    const head = rest.split("/")[0];
    if (head === "uploads") return config.assetBaseUrl + value;
    if (IMG_DIRS.indexOf(head) !== -1) return value;
    const filename = rest.split("/").pop();
    const sub = guessSubdir(filename);
    return sub ? "/images/" + sub + "/" + filename : localFallback;
  }
  return value;
}

module.exports = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: "POST", data }),
  put: (path, data) => request(path, { method: "PUT", data }),
  patch: (path, data) => request(path, { method: "PATCH", data }),
  del: (path) => request(path, { method: "DELETE" }),
  imageUrl
};
