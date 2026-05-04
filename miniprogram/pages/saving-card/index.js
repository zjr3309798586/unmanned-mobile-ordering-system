const api = require("../../utils/api");
const auth = require("../../utils/auth");
const format = require("../../utils/format");

Page({
  data: {
    loggedIn: false,
    opened: false,
    openButtonText: "立即开通",
    heroPriceText: "¥ 0.00",
    plans: [],
    coupons: [],
    products: []
  },

  onShow() {
    this.setData({
      loggedIn: auth.isLoggedIn(),
      opened: !!wx.getStorageSync("savingCardOpened"),
      openButtonText: wx.getStorageSync("savingCardOpened") ? "已开通" : "立即开通"
    });
    this.loadData();
  },

  loadData() {
    Promise.all([
      api.get("/saving-card/plans"),
      api.get("/coupons"),
      api.get("/products")
    ]).then(([plans, coupons, products]) => {
      const decoratedPlans = (plans || []).map((plan) => ({
          ...plan,
          priceText: format.money(plan.price)
        }));
      this.setData({
        plans: decoratedPlans,
        heroPriceText: decoratedPlans.length ? decoratedPlans[0].priceText : "¥ 0.00",
        coupons: (coupons || []).filter((coupon) => coupon.available).map((coupon) => ({
          ...coupon,
          discountText: format.money(coupon.discountAmount)
        })),
        products: (products || []).slice(0, 3).map((product) => ({
          ...product,
          imageUrl: api.imageUrl(product.image),
          priceText: format.money(product.price),
          savingPriceText: format.money(Math.max(Number(product.price || 0) - 2, 0))
        }))
      });
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  openCard() {
    if (!auth.isLoggedIn()) {
      wx.showToast({ title: "请先登录", icon: "none" });
      wx.redirectTo({ url: "/pages/mine/index" });
      return;
    }
    wx.setStorageSync("savingCardOpened", true);
    this.setData({ opened: true, openButtonText: "已开通" });
    wx.showToast({ title: "省钱卡已开通", icon: "success" });
  },

  goMenu() {
    wx.redirectTo({ url: "/pages/menu/index" });
  },

  goDetail(event) {
    wx.navigateTo({ url: "/pages/detail/index?id=" + event.currentTarget.dataset.id });
  }
});
