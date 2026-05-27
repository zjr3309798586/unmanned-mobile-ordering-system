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

// 已知的图片子目录(若路径已带子目录则不再补)
const IMG_DIRS = ["nav", "home", "menu", "mine", "saving", "mascot", "common", "icons"];

// 按文件名前缀推断子目录(用于把后端返回的旧扁平路径自动重写到子目录)
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
    return localFallback;
  }
  if (value.indexOf("/images/") === 0) {
    // 已带子目录(/images/menu/x.png),原样返回
    const rest = value.substring("/images/".length);
    const head = rest.split("/")[0];
    if (IMG_DIRS.indexOf(head) !== -1) return value;
    // 旧扁平路径(/images/x.png),按文件名前缀自动补子目录
    const filename = rest.split("/").pop();
    const sub = guessSubdir(filename);
    return sub ? "/images/" + sub + "/" + filename : localFallback;
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
