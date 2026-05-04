const auth = require("./utils/auth");

App({
  globalData: {
    userSession: null
  },

  onLaunch() {
    this.globalData.userSession = auth.getSession();
  }
});
