const api = require("../../utils/api");
const auth = require("../../utils/auth");
const format = require("../../utils/format");

Page({
  data: {
    store: null,
    products: [],
    coupons: [],
    bannerTag: "云豹上新",
    bannerTitleLines: ["蓝杯鲜饮", "轻松点单"],
    bannerText: "到店自取快一步，会员券下单自动抵扣。",
    bannerActionText: "去点餐",
    bannerImageUrl: api.imageUrl("/images/mascot-yunbao.png"),
    couponTitle: "正在读取优惠券",
    couponCopy: "优惠信息会从后台优惠券数据同步。",
    couponActionText: "去领取",
    notice: "",
    keyword: "",
    taskNote: "登录后同步订单杯数，累计 8 杯可得饮品券",
    taskProgressWidth: 0,
    taskFootnote: "请先登录后查看你的集杯进度。"
  },

  onLoad() {
    this.loadData();
  },

  loadData() {
    Promise.all([
      api.get("/store"),
      api.get("/products"),
      api.get("/coupons"),
      api.get("/banners"),
      auth.isLoggedIn() ? api.get("/orders") : Promise.resolve([])
    ]).then(([store, products, coupons, banners, orders]) => {
      const banner = (banners || [])[0] || {};
      const availableCoupons = (coupons || []).filter((item) => item.available);
      const firstCoupon = availableCoupons[0];
      const task = this.buildTask(orders || []);
      this.setData({
        store,
        bannerTag: banner.tagText || "云豹上新",
        bannerTitleLines: (banner.title || "蓝杯鲜饮 轻松点单").split(/\s+/),
        bannerText: banner.subtitle || "到店自取快一步，会员券下单自动抵扣。",
        bannerActionText: banner.linkText || "去点餐",
        bannerImageUrl: api.imageUrl(banner.image || "/images/mascot-yunbao.png"),
        products: (products || []).slice(0, 3).map(this.decorateProduct),
        coupons: availableCoupons.slice(0, 2).map((item) => ({
          ...item,
          discountText: format.money(item.discountAmount)
        })),
        couponTitle: firstCoupon ? firstCoupon.title + " · 减 " + format.money(firstCoupon.discountAmount) : "当前暂无可领取优惠券",
        couponCopy: firstCoupon ? firstCoupon.conditionText + "，开通省钱卡后可领取并在结算页使用。" : "可在后台管理端新增优惠券，前台会自动同步。",
        couponActionText: firstCoupon ? "去领取" : "去看看",
        taskNote: task.note,
        taskProgressWidth: task.percent,
        taskFootnote: task.footnote,
        notice: store && store.notice ? store.notice : "欢迎使用云豹小点。"
      });
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  decorateProduct(product) {
    return {
      ...product,
      imageUrl: api.imageUrl(product.image),
      priceText: format.money(product.price)
    };
  },

  buildTask(orders) {
    const target = 8;
    let totalCupCount = 0;
    (orders || []).forEach((order) => {
      (order.items || []).forEach((item) => {
        totalCupCount += Number(item.quantity || 0);
      });
    });
    const completed = Math.min(totalCupCount, target);
    const remaining = Math.max(target - completed, 0);
    return {
      note: auth.isLoggedIn() ? "订单杯数来自后台订单数据，累计 8 杯可得饮品券" : "登录后同步订单杯数，累计 8 杯可得饮品券",
      percent: Math.round((completed / target) * 100),
      footnote: auth.isLoggedIn()
        ? (remaining > 0 ? `已完成 ${completed} / ${target} 杯，再买 ${remaining} 杯可领取奖励。` : `已完成 ${target} / ${target} 杯，可前往省钱卡页面领取奖励。`)
        : "请先登录后查看你的集杯进度。"
    };
  },

  onKeywordInput(event) {
    this.setData({ keyword: event.detail.value });
  },

  goMenu() {
    if (this.data.keyword) {
      wx.setStorageSync("menuKeyword", this.data.keyword);
    }
    wx.redirectTo({ url: "/pages/menu/index" });
  },

  goSavingCard() {
    wx.redirectTo({ url: "/pages/saving-card/index" });
  },

  goDetail(event) {
    wx.navigateTo({
      url: "/pages/detail/index?id=" + event.currentTarget.dataset.id
    });
  }
});
