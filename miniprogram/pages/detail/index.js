const api = require("../../utils/api");
const auth = require("../../utils/auth");

Page({
  data: {
    product: {
      id: "P-1001",
      name: "荔枝冰奶",
      description: "手剥时令妃子笑 | 广西横州七窨茉莉花茶 | 冷链鲜奶",
      imageUrl: "/images/menu/menu-product-orange.png",
      price: 13.9,
      priceInt: "13"
    },
    tempOpts: ["正常冰", "少冰"],
    tempIdx: 0,
    sugarTypeOpts: ["默认糖"],
    sugarTypeIdx: 0,
    sweetOpts: ["十分甜", "不额外加糖", "七分甜", "五分甜"],
    sweetIdx: 2,
    quantity: 1,
    totalPrice: "13.9",
    specSummary: "中/正常冰/默认糖/七分甜",
    isFav: false
  },

  onLoad(query) {
    var pid = (query && query.id) || "P-1001";
    var self = this;
    this.setData({ isFav: false });
    this.loadFavoriteStatus(pid);
    if (api && api.get) {
      api.get("/products/" + pid).then(function (p) {
        if (!p) return;
        self.setData({
          product: {
            id: p.id,
            name: p.name,
            description: p.description || "",
            imageUrl: p.image ? api.imageUrl(p.image) : "/images/menu/menu-product-orange.png",
            price: Number(p.price || 0),
            priceInt: String(Math.round(Number(p.price || 0)))
          }
        });
        self.recalc();
      }).catch(function () { self.recalc(); });
    } else {
      this.recalc();
    }
  },

  chooseOpt(event) {
    var group = event.currentTarget.dataset.group;
    var idx = Number(event.currentTarget.dataset.idx);
    var key = group + "Idx";
    var update = {};
    update[key] = idx;
    this.setData(update, () => this.recalc());
  },

  minusQty() {
    if (this.data.quantity > 1) {
      this.setData({ quantity: this.data.quantity - 1 }, () => this.recalc());
    }
  },

  plusQty() {
    this.setData({ quantity: this.data.quantity + 1 }, () => this.recalc());
  },

  recalc() {
    var total = (this.data.product.price * this.data.quantity).toFixed(1);
    var summary = "中/" + this.data.tempOpts[this.data.tempIdx]
      + "/" + this.data.sugarTypeOpts[this.data.sugarTypeIdx]
      + "/" + this.data.sweetOpts[this.data.sweetIdx];
    this.setData({ totalPrice: total, specSummary: summary });
  },

  goBack() {
    wx.navigateBack({ delta: 1, fail: function () { wx.redirectTo({ url: "/pages/menu/index" }); } });
  },

  syncLocalFavStatus(pid) {
    var favs = wx.getStorageSync("favoriteIds") || [];
    this.setData({ isFav: favs.indexOf(pid) >= 0 });
  },

  loadFavoriteStatus(pid) {
    if (!auth || !auth.isLoggedIn || !auth.isLoggedIn()) {
      this.syncLocalFavStatus(pid);
      return;
    }
    api.get("/favorites/" + encodeURIComponent(pid) + "/status")
      .then((data) => {
        this.setData({ isFav: !!(data && data.favorite) });
      })
      .catch(() => {
        this.syncLocalFavStatus(pid);
      });
  },

  ensureFavoriteLogin() {
    if (auth && auth.isLoggedIn && auth.isLoggedIn()) {
      return Promise.resolve();
    }
    if (auth && auth.devLogin) {
      return auth.devLogin();
    }
    return Promise.reject(new Error("请先登录"));
  },

  toggleLocalFav(pid) {
    var favs = wx.getStorageSync("favoriteIds") || [];
    var i = favs.indexOf(pid);
    if (i >= 0) {
      favs.splice(i, 1);
      wx.showToast({ title: "已取消收藏", icon: "none" });
      this.setData({ isFav: false });
    } else {
      favs.push(pid);
      wx.showToast({ title: "已加入口味收藏", icon: "success" });
      this.setData({ isFav: true });
    }
    wx.setStorageSync("favoriteIds", favs);
  },

  toggleFav() {
    var pid = this.data.product.id;
    var self = this;
    this.ensureFavoriteLogin()
      .then(function () {
        if (self.data.isFav) {
          return api.del("/favorites/" + encodeURIComponent(pid))
            .then(function () {
              self.setData({ isFav: false });
              wx.showToast({ title: "已取消收藏", icon: "none" });
            });
        }
        return api.post("/favorites/" + encodeURIComponent(pid), {})
          .then(function () {
            self.setData({ isFav: true });
            wx.showToast({ title: "已加入口味收藏", icon: "success" });
          });
      })
      .catch(function () {
        self.toggleLocalFav(pid);
      });
  },

  addToCart() {
    var self = this;
    var spec = this.data.specSummary;
    var doAdd = function () {
      api.post("/cart/items", { productId: self.data.product.id, spec: spec, quantity: self.data.quantity })
        .then(function () {
          wx.showToast({ title: "已加入购物车", icon: "success" });
          wx.setStorageSync("openSelectedCartOnMenu", true);
          setTimeout(function () {
            wx.navigateBack({
              delta: 1,
              fail: function () { wx.redirectTo({ url: "/pages/menu/index" }); }
            });
          }, 350);
        })
        .catch(function (e) { wx.showToast({ title: e.message, icon: "none" }); });
    };
    if (auth && auth.isLoggedIn && auth.isLoggedIn()) doAdd();
    else if (auth && auth.devLogin) auth.devLogin().then(doAdd).catch(function () { wx.showToast({ title: "登录失败", icon: "none" }); });
    else doAdd();
  }
});
