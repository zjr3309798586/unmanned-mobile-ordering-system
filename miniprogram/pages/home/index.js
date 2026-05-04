const api = require("../../utils/api");
const format = require("../../utils/format");

Page({
  data: {
    store: null,
    products: [],
    coupons: [],
    bannerImageUrl: api.imageUrl("/images/food-placeholder.svg"),
    notice: "",
    keyword: ""
  },

  onLoad() {
    this.loadData();
  },

  loadData() {
    Promise.all([
      api.get("/store"),
      api.get("/products"),
      api.get("/coupons")
    ]).then(([store, products, coupons]) => {
      this.setData({
        store,
        products: (products || []).slice(0, 3).map(this.decorateProduct),
        coupons: (coupons || []).filter((item) => item.available).slice(0, 2).map((item) => ({
          ...item,
          discountText: format.money(item.discountAmount)
        })),
        notice: store && store.notice ? store.notice : "欢迎使用无人移动点餐系统。"
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
