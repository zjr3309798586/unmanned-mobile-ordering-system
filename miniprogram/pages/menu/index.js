const api = require("../../utils/api");
const auth = require("../../utils/auth");
const format = require("../../utils/format");

Page({
  data: {
    categories: [],
    products: [],
    activeCat: "",
    catTitle: "全部商品",
    cartQty: 0,
    cartTotal: "0.0",
    couponCount: 0,
    drawerOpen: false,
    couponDrawerOpen: false,
    couponItems: [],
    cartItems: [],
    searchOpen: false,
    searchKw: "",
    searchHits: [],
    orderMode: "pickup",
    orderModeText: "下单立即制作"
  },

  _allProducts: [],
  _cartItems: [],

  onShow() {
    this.syncOrderMode(wx.getStorageSync("orderMode") === "delivery" ? "delivery" : "pickup", false);
    this.loadData();
  },

  loadData() {
    var self = this;
    Promise.all([
      api.get("/categories"),
      api.get("/products"),
      auth.isLoggedIn() ? api.get("/cart") : Promise.resolve(null),
      auth.isLoggedIn() ? api.get("/user/coupons") : Promise.resolve([])
    ]).then(function (res) {
      var cats = res[0] || [];
      var products = res[1] || [];
      var cart = res[2];
      var coupons = (res[3] || []).filter(function (c) { return c.status === "AVAILABLE" || !c.status; });
      var activeCat = cats.length > 0 ? cats[0].id : "";
      self._allProducts = products;
      self._cartItems = cart ? (cart.items || []) : [];
      self.setData({
        categories: cats,
        activeCat: activeCat,
        catTitle: cats.length > 0 ? cats[0].name : "全部商品",
        products: self.buildProducts(activeCat),
        cartQty: cart ? (cart.totalQuantity || 0) : 0,
        cartTotal: cart ? Number(cart.totalAmount || 0).toFixed(1) : "0.0",
        couponCount: coupons.length,
        couponItems: self.buildCouponItems(coupons),
        cartItems: self.buildCartItems()
      });
    }).catch(function () {});
  },

  buildProducts(catId) {
    var cartItems = this._cartItems;
    return (this._allProducts || []).filter(function (p) {
      return !catId || p.categoryId === catId;
    }).map(function (p) {
      var price = Number(p.price || 0);
      var ps = price.toFixed(1).split(".");
      var qty = 0;
      cartItems.forEach(function (ci) { if (ci.productId === p.id) qty += ci.quantity; });
      return {
        ...p,
        imageUrl: api.imageUrl(p.image),
        priceInt: ps[0],
        priceDec: "." + ps[1],
        qty: qty
      };
    });
  },

  syncCart(cart) {
    this._cartItems = cart ? (cart.items || []) : [];
    this.setData({
      cartQty: cart ? (cart.totalQuantity || 0) : 0,
      cartTotal: cart ? Number(cart.totalAmount || 0).toFixed(1) : "0.0",
      products: this.buildProducts(this.data.activeCat),
      cartItems: this.buildCartItems()
    });
  },

  buildCartItems() {
    return (this._cartItems || []).map(function (it) {
      var sub = Number((it.subtotal != null ? it.subtotal : Number(it.price) * it.quantity) || 0).toFixed(1);
      return {
        id: it.id,
        productName: it.productName || it.name || "商品",
        imageUrl: it.image ? (api.imageUrl ? api.imageUrl(it.image) : it.image) : "/images/common/food-placeholder.svg",
        specText: it.specText || (typeof it.spec === "string" ? it.spec : "标准杯"),
        subtotalText: sub,
        quantity: it.quantity,
        price: it.price
      };
    });
  },

  buildCouponItems(coupons) {
    return (coupons || []).map(function (c) {
      var min = Number(c.minAmount != null ? c.minAmount : (c.conditionAmount || 0));
      return {
        id: c.couponId || c.id,
        title: c.title || "优惠券",
        minAmount: min,
        discountAmount: Number(c.discountAmount || 0).toFixed(0),
        conditionText: c.conditionText || ("满 ¥" + min + " 可用")
      };
    });
  },

  openCouponDrawer() {
    var self = this;
    this.setData({ couponDrawerOpen: true });

    var show = function () {
      api.get("/user/coupons").then(function (list) {
        var coupons = (list || []).filter(function (c) { return c.status === "AVAILABLE" || !c.status; });
        self.setData({
          couponCount: coupons.length,
          couponItems: self.buildCouponItems(coupons),
          couponDrawerOpen: true
        });
      }).catch(function (e) {
        self.setData({ couponDrawerOpen: true, couponItems: [] });
        wx.showToast({ title: e.message || "优惠券加载失败", icon: "none" });
      });
    };
    if (auth.isLoggedIn && auth.isLoggedIn()) {
      show();
      return;
    }
    if (auth.devLogin) {
      auth.devLogin().then(show).catch(function () {
        self.setData({ couponDrawerOpen: true, couponItems: [] });
        wx.showToast({ title: "登录失败", icon: "none" });
      });
    }
  },

  closeCouponDrawer() {
    this.setData({ couponDrawerOpen: false });
  },

  syncOrderMode(mode, showToast) {
    var nextMode = mode === "delivery" ? "delivery" : "pickup";
    wx.setStorageSync("orderMode", nextMode);
    this.setData({
      orderMode: nextMode,
      orderModeText: nextMode === "delivery" ? "预计 20-30 分钟送达" : "下单立即制作"
    });
    if (showToast) {
      wx.showToast({
        title: nextMode === "delivery" ? "已切换为平台外送" : "已切换为到店自取",
        icon: "none"
      });
    }
  },

  switchOrderMode(event) {
    this.syncOrderMode(event.currentTarget.dataset.mode, true);
  },

  goSavingCard() {
    wx.redirectTo({ url: "/pages/saving-card/index" });
  },

  noop() {
    // 阻止商品卡片点击穿透到详情页。
  },

  openDrawer() {
    this.setData({ drawerOpen: true });
  },

  closeDrawer() {
    this.setData({ drawerOpen: false });
  },

  drawerMinus(event) {
    var self = this;
    var id = event.currentTarget.dataset.id;
    var quantity = Number(event.currentTarget.dataset.quantity || 1);
    if (!auth.isLoggedIn()) return;
    var promise = quantity <= 1
      ? api.del("/cart/items/" + id)
      : api.patch("/cart/items/" + id, { quantity: quantity - 1 });
    promise
      .then(function (data) { self.syncCart(data); })
      .catch(function (e) { wx.showToast({ title: e.message, icon: "none" }); });
  },

  drawerPlus(event) {
    var self = this;
    var id = event.currentTarget.dataset.id;
    var quantity = Number(event.currentTarget.dataset.quantity || 1);
    if (!auth.isLoggedIn()) return;
    api.patch("/cart/items/" + id, { quantity: quantity + 1 })
      .then(function (data) { self.syncCart(data); })
      .catch(function (e) { wx.showToast({ title: e.message, icon: "none" }); });
  },

  clearCart() {
    var self = this;
    if (!auth.isLoggedIn()) return;
    wx.showModal({
      title: "清空购物车",
      content: "确定要清空所有已选商品吗?",
      success: function (res) {
        if (!res.confirm) return;
        api.del("/cart")
          .then(function (data) { self.syncCart(data || { items: [], totalQuantity: 0, totalAmount: 0 }); wx.showToast({ title: "已清空", icon: "success" }); })
          .catch(function (e) { wx.showToast({ title: e.message, icon: "none" }); });
      }
    });
  },

  switchCat(event) {
    var catId = event.currentTarget.dataset.id;
    var cat = this.data.categories.find(function (c) { return c.id === catId; });
    this.setData({
      activeCat: catId,
      catTitle: cat ? cat.name : "全部商品",
      products: this.buildProducts(catId)
    });
  },

  addCart(event) {
    var id = event.currentTarget.dataset.id;
    wx.navigateTo({ url: "/pages/detail/index?id=" + id });
  },

  openSearch() {
    this.setData({ searchOpen: true, searchKw: "", searchHits: [] });
  },

  closeSearch() {
    this.setData({ searchOpen: false });
  },

  onSearchInput(event) {
    var kw = (event.detail.value || "").trim().toLowerCase();
    if (!kw) {
      this.setData({ searchKw: "", searchHits: [] });
      return;
    }
    var hits = (this._allProducts || []).filter(function (p) {
      var n = (p.name || "").toLowerCase();
      var d = (p.description || "").toLowerCase();
      return n.indexOf(kw) >= 0 || d.indexOf(kw) >= 0;
    }).map(function (p) {
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        imageUrl: p.image ? api.imageUrl(p.image) : "/images/common/food-placeholder.svg",
        priceText: Number(p.price || 0).toFixed(1)
      };
    });
    this.setData({ searchKw: kw, searchHits: hits });
  },

  minusCart(event) {
    var id = event.currentTarget.dataset.id;
    var self = this;
    if (!auth.isLoggedIn()) return;
    var cartItem = this._cartItems.find(function (ci) { return ci.productId === id; });
    if (!cartItem) return;
    if (cartItem.quantity <= 1) {
      api.del("/cart/items/" + cartItem.id)
        .then(function (data) { self.syncCart(data); })
        .catch(function (e) { wx.showToast({ title: e.message, icon: "none" }); });
    } else {
      api.patch("/cart/items/" + cartItem.id, { quantity: cartItem.quantity - 1 })
        .then(function (data) { self.syncCart(data); })
        .catch(function (e) { wx.showToast({ title: e.message, icon: "none" }); });
    }
  },

  goDetail(event) {
    wx.navigateTo({ url: "/pages/detail/index?id=" + event.currentTarget.dataset.id });
  }
});
