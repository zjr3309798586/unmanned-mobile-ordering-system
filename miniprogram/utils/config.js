module.exports = {
  apiBaseUrl: "http://127.0.0.1:8080/api",
  assetBaseUrl: "http://127.0.0.1:8080",

  // 开发者工具联调先用后端 dev-login。换成真实微信登录时改为 false，并配置后端 WECHAT_APP_ID / WECHAT_APP_SECRET。
  useDevLogin: true,
  devNickname: "微信开发工具用户"
};
