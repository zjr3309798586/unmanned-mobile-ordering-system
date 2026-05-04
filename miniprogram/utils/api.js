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
  if (!value) {
    return config.assetBaseUrl + "/images/food-placeholder.svg";
  }
  if (value.indexOf("/images/") === 0) {
    return config.assetBaseUrl + value;
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
