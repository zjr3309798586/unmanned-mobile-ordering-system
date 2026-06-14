const serverOrigin = "http://127.0.0.1:8080";

module.exports = {
  apiBaseUrl: serverOrigin + "/api",
  assetBaseUrl: serverOrigin,
  requestTimeout: 5000,
  enableMockFallback: false,

  // DevTools uses a local visitor account before real WeChat login is configured.
  useDevLogin: true,
  devNickname: "游客用户"
};
