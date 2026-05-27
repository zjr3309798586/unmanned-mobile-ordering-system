const auth = require("./utils/auth");
const config = require("./utils/config");

App({
  globalData: {
    userSession: null
  },

  onLaunch() {
    this.globalData.userSession = auth.getSession();
    if (!auth.isLoggedIn() && config.useDevLogin) {
      auth.devLogin().then((session) => {
        this.globalData.userSession = session;
      }).catch(() => {});
    }
  }
});
