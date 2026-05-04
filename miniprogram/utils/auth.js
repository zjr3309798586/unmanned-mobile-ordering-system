const api = require("./api");
const config = require("./config");

function getSession() {
  return wx.getStorageSync("userSession") || null;
}

function isLoggedIn() {
  return !!wx.getStorageSync("userToken");
}

function setSession(session) {
  if (!session || !session.token) {
    wx.removeStorageSync("userToken");
    wx.removeStorageSync("userSession");
    return;
  }
  wx.setStorageSync("userToken", session.token);
  wx.setStorageSync("userSession", session);
}

function devLogin() {
  return api.post("/auth/dev-login", {
    nickname: config.devNickname
  }).then((session) => {
    setSession(session);
    return session;
  });
}

function wechatLogin() {
  if (config.useDevLogin) {
    return devLogin();
  }

  return new Promise((resolve, reject) => {
    wx.login({
      success(loginResult) {
        if (!loginResult.code) {
          reject(new Error("没有获取到微信登录 code"));
          return;
        }
        api.post("/auth/wechat-login", {
          code: loginResult.code,
          nickname: "微信用户",
          avatarUrl: ""
        }).then((session) => {
          setSession(session);
          resolve(session);
        }).catch(reject);
      },
      fail(error) {
        reject(new Error(error.errMsg || "微信登录失败"));
      }
    });
  });
}

function logout() {
  return api.post("/auth/logout", {})
    .catch(() => null)
    .then(() => setSession(null));
}

module.exports = {
  getSession,
  isLoggedIn,
  setSession,
  devLogin,
  wechatLogin,
  logout
};
