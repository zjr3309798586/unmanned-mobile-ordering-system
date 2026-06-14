const api = require("../../utils/api");
const auth = require("../../utils/auth");
const format = require("../../utils/format");

Page({
  data: {
    tab: "self",
    loading: false,
    loggedIn: false,
    orders: [],
    emptyText: "登录后查看订单",
    emptyButtonText: "去登录",
    emptyTarget: "mine"
  },

  _allOrders: [],

  onShow() {
    const loggedIn = auth.isLoggedIn && auth.isLoggedIn();
    this.setData({ loggedIn });
    if (loggedIn) {
      this.loadOrders();
    } else {
      this._allOrders = [];
      this.setData({
        orders: [],
        emptyText: "登录后查看订单",
        emptyButtonText: "去登录",
        emptyTarget: "mine"
      });
    }
  },

  switchTab(event) {
    this.setData({ tab: event.currentTarget.dataset.tab }, () => {
      this.applyTab();
    });
  },

  loadOrders() {
    this.setData({ loading: true });
    api.get("/orders").then((orders) => {
      this._allOrders = (orders || []).map((order) => this.decorateOrder(order));
      this.applyTab();
    }).catch((error) => {
      this.setData({
        orders: [],
        emptyText: error.message || "订单加载失败",
        emptyButtonText: "重新加载",
        emptyTarget: "reload"
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  applyTab() {
    const currentTab = this.data.tab;
    const filtered = this._allOrders.filter((order) => {
      if (currentTab === "delivery") return order.pickupType === "DELIVERY";
      return order.pickupType !== "DELIVERY";
    });
    this.setData({
      orders: filtered,
      emptyText: "暂无订单",
      emptyButtonText: "去点餐",
      emptyTarget: "menu"
    });
  },

  decorateOrder(order) {
    const items = order.items || [];
    const pickupType = order.pickupType || "SELF_PICKUP";
    const isDelivery = pickupType === "DELIVERY";
    const pickupNo = order.pickupNo || order.orderNo || "—";
    return {
      id: order.id,
      pickupType: pickupType,
      isDelivery: isDelivery,
      storeName: order.storeName || "云豹小点·校园店",
      statusText: format.statusText(order.status),
      timeText: (order.createdAt || "").replace("T", " ").slice(0, 19) || "—",
      pickupNo: pickupNo,
      metaText: isDelivery ? ("配送至 " + (order.deliveryAddress || "校园地址待确认")) : ("取餐号 " + pickupNo),
      deliveryContact: order.deliveryContact || "未填写",
      deliveryFee: Number(order.deliveryFee || 0).toFixed(1),
      thumbs: items.length
        ? items.map((item) => api.imageUrl(item.image || "")).slice(0, 3)
        : ["/images/common/food-placeholder.svg"],
      amount: Number(order.payableAmount || 0).toFixed(0),
      qty: items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
    };
  },

  handleEmptyAction() {
    if (this.data.emptyTarget === "mine") {
      wx.redirectTo({ url: "/pages/mine/index" });
      return;
    }
    if (this.data.emptyTarget === "reload") {
      this.loadOrders();
      return;
    }
    wx.redirectTo({ url: "/pages/menu/index" });
  },

  repeatOrder(event) {
    const id = event.currentTarget.dataset.id;
    if (!auth.isLoggedIn || !auth.isLoggedIn()) {
      wx.showToast({ title: "请先登录", icon: "none" });
      wx.redirectTo({ url: "/pages/mine/index" });
      return;
    }
    api.post("/orders/" + id + "/repeat", {}).then(() => {
      wx.showToast({ title: "已加入购物车", icon: "success" });
      setTimeout(() => { wx.navigateTo({ url: "/pages/cart/index" }); }, 500);
    }).catch((error) => {
      wx.showToast({ title: error.message || "操作失败", icon: "none" });
    });
  }
});
