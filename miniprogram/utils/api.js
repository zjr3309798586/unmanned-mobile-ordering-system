const config = require("./config");

function getToken() {
  return wx.getStorageSync("userToken") || "";
}

function request(path, options = {}) {
  const token = getToken();
  const header = Object.assign({
    "content-type": "application/json"
  }, options.header || {});

  if (token) {
    header["X-User-Token"] = token;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: config.apiBaseUrl + path,
      method: options.method || "GET",
      data: options.data || {},
      header,
      success(res) {
        const payload = res.data || {};
        if (res.statusCode < 200 || res.statusCode >= 300 || payload.success === false) {
          reject(new Error(payload.message || "接口请求失败"));
          return;
        }
        resolve(payload.data);
      },
      fail(error) {
        reject(new Error(error.errMsg || "网络连接失败"));
      }
    });
  });
}

function imageUrl(value) {
  const localFallback = "/images/food-placeholder.svg";
  const localAssets = {
    "food-placeholder.svg": true,
    "product-default.svg": true,
    "product-orange-coffee.svg": true,
    "product-coconut-latte.svg": true,
    "product-grapefruit-tea.svg": true,
    "product-milk-tea.svg": true,
    "product-lemon-tea.svg": true,
    "product-toast.svg": true,
    "mascot-yunbao.png": true,
    "mascot-yunbao-144.png": true
  };
  if (!value) {
    return localFallback;
  }
  if (value.indexOf("/images/") === 0) {
    const filename = value.split("/").pop();
    return localAssets[filename] ? "/images/" + filename : localFallback;
  }
  if (value.indexOf("http://") === 0 || value.indexOf("https://") === 0) {
    return localFallback;
  }
  return value;
}

module.exports = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: "POST", data }),
  patch: (path, data) => request(path, { method: "PATCH", data }),
  del: (path) => request(path, { method: "DELETE" }),
  imageUrl
};
