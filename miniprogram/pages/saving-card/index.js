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
      api.get("/products"),
      auth.isLoggedIn() ? api.get("/user/coupons") : Promise.resolve([]),
      auth.isLoggedIn() ? api.get("/mine") : Promise.resolve(null)
    ]).then(([plans, coupons, products, userCoupons, profile]) => {
      const couponStatus = {};
      (userCoupons || []).forEach((coupon) => {
        couponStatus[coupon.couponId || coupon.id] = coupon.status;
      });
      const backendOpened = !!(profile && /省钱卡/.test(profile.memberLevel || ""));
      const decoratedPlans = (plans || []).map((plan) => ({
          ...plan,
          priceText: format.money(plan.price)
        }));
      this.setData({
        opened: this.data.opened || backendOpened,
        openButtonText: this.data.opened || backendOpened ? "已开通" : "立即开通",
        plans: decoratedPlans,
        heroPriceText: decoratedPlans.length ? decoratedPlans[0].priceText : "¥ 0.00",
        coupons: (coupons || []).filter((coupon) => coupon.available).map((coupon) => ({
          ...coupon,
          discountText: format.money(coupon.discountAmount),
          discountAmountText: Number(coupon.discountAmount || 0).toFixed(0),
          claimed: couponStatus[coupon.id] === "AVAILABLE" || couponStatus[coupon.id] === "USED",
          claimText: couponStatus[coupon.id] === "USED" ? "已使用" : (couponStatus[coupon.id] === "AVAILABLE" ? "已领取" : "领取")
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
    api.post("/saving-card/open", {}).then(() => {
      wx.setStorageSync("savingCardOpened", true);
      this.setData({ opened: true, openButtonText: "已开通" });
      wx.showToast({ title: "省钱卡已开通", icon: "success" });
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  claimCoupon(event) {
    if (!auth.isLoggedIn()) {
      wx.showToast({ title: "请先登录", icon: "none" });
      wx.redirectTo({ url: "/pages/mine/index" });
      return;
    }
    if (!this.data.opened) {
      wx.showToast({ title: "请先开通省钱卡", icon: "none" });
      return;
    }
    const couponId = event.currentTarget.dataset.id;
    api.post(`/user/coupons/${couponId}/claim`, {}).then(() => {
      wx.showToast({ title: "优惠券已领取", icon: "success" });
      this.loadData();
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  goMenu() {
    wx.redirectTo({ url: "/pages/menu/index" });
  },

  goDetail(event) {
    wx.navigateTo({ url: "/pages/detail/index?id=" + event.currentTarget.dataset.id });
  }
});
