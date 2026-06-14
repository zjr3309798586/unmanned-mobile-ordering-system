const api = require("../../utils/api");
const auth = require("../../utils/auth");

Page({
  data: {
    loggedIn: false,
    opened: false,
    opening: false,
    openButtonText: "立即开通",
    heroPlanName: "月卡权益 · 校园专享",
    heroPriceText: "¥18",
    couponCountText: "最多 4 张",
    plans: [],
    coupons: [],
    products: []
  },

  onShow() {
    this.setData({
      loggedIn: auth.isLoggedIn(),
      opening: false,
      openButtonText: this.data.opened ? "去点餐" : "立即开通"
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
      const opened = profile ? backendOpened : this.data.opened;
      const decoratedPlans = (plans || []).map((plan) => ({
        ...plan,
        priceText: this.compactMoney(plan.price, "¥18")
      }));
      const availableCoupons = (coupons || []).filter((coupon) => coupon.available !== false);

      this.setData({
        opened,
        opening: false,
        openButtonText: opened ? "去点餐" : "立即开通",
        plans: decoratedPlans,
        heroPlanName: decoratedPlans.length ? decoratedPlans[0].name : "月卡权益 · 校园专享",
        heroPriceText: decoratedPlans.length ? decoratedPlans[0].priceText : "¥18",
        couponCountText: availableCoupons.length ? "共 " + Math.min(availableCoupons.length, 4) + " 张" : "暂无可领",
        coupons: availableCoupons.slice(0, 4).map((coupon, index) => {
          const status = couponStatus[coupon.id];
          const claimed = status === "AVAILABLE" || status === "USED";
          return {
            ...coupon,
            ticketTone: index % 2 === 1 ? "is-warm" : "",
            discountAmountText: Number(coupon.discountAmount || 0).toFixed(0),
            conditionText: coupon.conditionText || ("满 " + Number(coupon.minAmount || 0).toFixed(0) + " 元可用"),
            claimed,
            claimText: status === "USED" ? "已使用" : (claimed ? "已领取" : (opened ? "立即领取" : "开通后领取"))
          };
        }),
        products: (products || []).slice(0, 3).map((product) => ({
          ...product,
          imageUrl: api.imageUrl(product.image),
          priceText: this.compactMoney(product.price, "¥0"),
          savingPriceText: this.compactMoney(Math.max(Number(product.price || 0) * 0.85, 0), "¥0"),
          savedText: "会员省 " + this.compactMoney(Math.max(Number(product.price || 0) * 0.15, 0), "¥0")
        }))
      });
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  compactMoney(value, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    const text = num % 1 === 0 ? num.toFixed(0) : num.toFixed(1);
    return "¥" + text;
  },

  openCard() {
    if (this.data.opening) return;
    if (this.data.opened) {
      wx.redirectTo({ url: "/pages/menu/index" });
      return;
    }
    if (!auth.isLoggedIn()) {
      wx.showToast({ title: "请先登录", icon: "none" });
      wx.redirectTo({ url: "/pages/mine/index" });
      return;
    }

    this.setData({ opening: true, openButtonText: "开通中..." });
    api.post("/saving-card/open", {}).then(() => {
      this.setData({ opened: true, opening: false, openButtonText: "去点餐" });
      wx.showToast({ title: "省钱卡已开通", icon: "success" });
      this.loadData();
    }).catch((error) => {
      this.setData({ opening: false, openButtonText: "立即开通" });
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
    const coupon = this.data.coupons.find((item) => String(item.id) === String(couponId));
    if (coupon && coupon.claimed) {
      wx.showToast({ title: coupon.claimText, icon: "none" });
      return;
    }

    api.post(`/user/coupons/${couponId}/claim`, {}).then(() => {
      wx.showToast({ title: "优惠券已领取", icon: "success" });
      this.loadData();
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  scrollRules() {
    wx.pageScrollTo({
      selector: "#saving-rules",
      duration: 220,
      fail() {
        wx.pageScrollTo({ scrollTop: 9999, duration: 220 });
      }
    });
  },

  goDetail(event) {
    wx.navigateTo({ url: "/pages/detail/index?id=" + event.currentTarget.dataset.id });
  }
});
