const api = require("../../utils/api");
const auth = require("../../utils/auth");
const format = require("../../utils/format");

function emptyProfile() {
  return {
    nickname: "未登录",
    memberLevel: "游客",
    balanceText: "¥ 0.00",
    couponCount: 0,
    savingAmountText: "0.00"
  };
}

Page({
  data: {
    loggedIn: false,
    loginSubtitle: "登录后解锁更多权益",
    waitingCount: 0,
    profile: emptyProfile(),
    services: [
      { name: "我的订单", desc: "查看订单状态", target: "order" },
      { name: "购物车", desc: "查看已选商品", target: "cart" },
      { name: "省钱卡", desc: "会员权益和优惠", target: "saving" },
      { name: "联系客服", desc: "门店问题反馈", target: "service" }
    ]
  },

  onShow() {
    this.setData({
      loggedIn: auth.isLoggedIn(),
      loginSubtitle: auth.isLoggedIn() ? "正在同步订单与权益" : "登录后解锁更多权益"
    });
    if (auth.isLoggedIn()) {
      this.loadProfile();
    } else {
      this.setData({ profile: emptyProfile(), waitingCount: 0, loginSubtitle: "登录后解锁更多权益" });
    }
  },

  login() {
    auth.wechatLogin().then(() => {
      this.setData({ loggedIn: true });
      this.loadProfile();
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  handleProfileTap() {
    if (auth.isLoggedIn && auth.isLoggedIn()) {
      this.logout();
      return;
    }
    this.login();
  },

  logout() {
    wx.showModal({
      title: "退出登录",
      content: "退出后本机将清除登录状态。",
      success: (result) => {
        if (!result.confirm) {
          return;
        }
        auth.logout().then(() => {
          this.setData({ loggedIn: false, profile: emptyProfile() });
        });
      }
    });
  },

  loadProfile() {
    var self = this;
    Promise.all([
      api.get("/mine"),
      api.get("/orders")
    ]).then(function (res) {
      var profile = res[0];
      var orders = res[1] || [];
      var waiting = orders.filter(function (o) { return o.status === "WAITING_PICKUP" || o.status === "DELIVERING"; }).length;
      self.setData({
        waitingCount: waiting,
        profile: {
          ...profile,
          balanceText: format.money(profile.balance),
          savingAmountText: format.money(profile.savingAmount)
        },
        loginSubtitle: /游客/.test(profile.nickname || "") ? "游客模式 · 本机订单可用" : "已登录 · 同步订单与权益"
      });
    }).catch(function (error) {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  goTarget(event) {
    const target = event.currentTarget.dataset.target;
    if (target === "order") {
      wx.redirectTo({ url: "/pages/order/index" });
      return;
    }
    if (target === "cart") {
      wx.navigateTo({ url: "/pages/cart/index" });
      return;
    }
    if (target === "saving") {
      wx.redirectTo({ url: "/pages/saving-card/index" });
      return;
    }
    if (target === "service") {
      wx.navigateTo({ url: "/pages/support/index" });
      return;
    }
    wx.showToast({ title: "门店电话：400-100-2026", icon: "none" });
  }
});
