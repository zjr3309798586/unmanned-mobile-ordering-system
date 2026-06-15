const defaultServerOrigin = "http://127.0.0.1:8080";
const storedServerOrigin = typeof wx !== "undefined" ? wx.getStorageSync("serverOrigin") : "";
const serverOrigin = storedServerOrigin || defaultServerOrigin;

module.exports = {
  serverOrigin,
  apiBaseUrl: serverOrigin + "/api",
  assetBaseUrl: serverOrigin,
  requestTimeout: 10000,
  enableMockFallback: false,

  // DevTools uses a local visitor account before real WeChat login is configured.
  useDevLogin: true,
  devNickname: "游客用户"
};
