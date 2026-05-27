const serverOrigin = "http://192.168.43.223:8080";

module.exports = {
  apiBaseUrl: serverOrigin + "/api",
  assetBaseUrl: serverOrigin,

  // 微信登录配置完成前，工具内先使用游客账号。
  useDevLogin: true,
  devNickname: "游客用户"
};
