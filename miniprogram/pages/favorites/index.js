const api = require("../../utils/api");
const auth = require("../../utils/auth");

Page({
  data: {
    loading: false,
    favorites: [],
    countText: "加载中..."
  },

  onShow() {
    this.initFavorites();
  },

  initFavorites() {
    const self = this;
    this.setData({ loading: true });
    this.ensureLogin()
      .then(() => self.migrateLocalFavorites())
      .then(() => self.loadFavorites())
      .catch((error) => {
        self.setData({ loading: false, favorites: [], countText: "还没有收藏商品" });
        wx.showToast({ title: error.message || "收藏加载失败", icon: "none" });
      });
  },

  ensureLogin() {
    if (auth && auth.isLoggedIn && auth.isLoggedIn()) {
      return Promise.resolve();
    }
    if (auth && auth.devLogin) {
      return auth.devLogin();
    }
    return Promise.reject(new Error("请先登录"));
  },

  migrateLocalFavorites() {
    const ids = wx.getStorageSync("favoriteIds") || [];
    if (!ids.length) {
      return Promise.resolve();
    }
    return Promise.all(ids.map((id) => {
      return api.post("/favorites/" + encodeURIComponent(id), {}).catch(() => null);
    })).then(() => {
      wx.removeStorageSync("favoriteIds");
    });
  },

  loadFavorites() {
    return api.get("/favorites")
      .then((products) => {
        const list = (products || []).map((item) => this.normalizeProduct(item));
        this.setData({
          loading: false,
          favorites: list,
          countText: list.length ? "共 " + list.length + " 件常点商品" : "还没有收藏商品"
        });
      })
      .catch((error) => {
        this.setData({ loading: false, favorites: [], countText: "还没有收藏商品" });
        wx.showToast({ title: error.message || "收藏加载失败", icon: "none" });
      });
  },

  normalizeProduct(product) {
    const price = Number(product.price || 0);
    return {
      id: product.id,
      name: product.name,
      description: product.description || "清爽好喝，适合日常复购",
      imageUrl: product.image ? api.imageUrl(product.image) : "/images/common/food-placeholder.svg",
      priceText: price.toFixed(1),
      tagList: Array.isArray(product.tags) && product.tags.length ? product.tags.slice(0, 2) : ["常点口味", "可复购"]
    };
  },

  removeFavorite(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    api.del("/favorites/" + encodeURIComponent(id))
      .then((products) => {
        const list = (products || []).map((item) => this.normalizeProduct(item));
        this.setData({
          favorites: list,
          countText: list.length ? "共 " + list.length + " 件常点商品" : "还没有收藏商品"
        });
        wx.showToast({ title: "已取消收藏", icon: "none" });
      })
      .catch((error) => {
        wx.showToast({ title: error.message || "取消失败", icon: "none" });
      });
  },

  goDetail(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: "/pages/detail/index?id=" + encodeURIComponent(id) });
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail() {
        wx.redirectTo({ url: "/pages/mine/index" });
      }
    });
  }
});
