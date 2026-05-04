const api = require("../../utils/api");
const auth = require("../../utils/auth");
const format = require("../../utils/format");

function createdText(value) {
  return value ? String(value).replace("T", " ").slice(0, 16) : "";
}

function decorateOrder(order) {
  const items = (order.items || []).map((item) => ({
    ...item,
    priceText: format.money(item.price),
    subtotalText: format.money(Number(item.price || 0) * Number(item.quantity || 0))
  }));
  return {
    ...order,
    items,
    statusText: format.statusText(order.status),
    pickupTypeText: format.pickupTypeText(order.pickupType),
    totalText: format.money(order.totalAmount),
    discountText: format.money(order.discountAmount),
    payableText: format.money(order.payableAmount),
    createdText: createdText(order.createdAt),
    canCancel: order.status === "WAITING_PICKUP",
    statusClass: order.status === "COMPLETED" ? "done" : order.status === "CANCELED" ? "cancel" : "waiting"
  };
}

Page({
  data: {
    loggedIn: false,
    needsLogin: true,
    tabs: [
      { id: "all", name: "全部订单", active: true },
      { id: "current", name: "进行中", active: false },
      { id: "history", name: "历史订单", active: false }
    ],
    activeTab: "all",
    orders: [],
    visibleOrders: [],
    empty: true
  },

  onShow() {
    this.setData({
      loggedIn: auth.isLoggedIn(),
      needsLogin: !auth.isLoggedIn()
    });
    if (auth.isLoggedIn()) {
      this.loadOrders();
    }
  },

  login() {
    auth.wechatLogin().then(() => {
      this.setData({ loggedIn: true, needsLogin: false });
      this.loadOrders();
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  selectTab(event) {
    const activeTab = event.currentTarget.dataset.id;
    this.setData({
      activeTab,
      tabs: this.data.tabs.map((tab) => ({
        ...tab,
        active: tab.id === activeTab
      }))
    });
    this.filterOrders();
  },

  loadOrders() {
    api.get("/orders").then((orders) => {
      this.setData({ orders: (orders || []).map(decorateOrder) });
      this.filterOrders();
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  filterOrders() {
    const visibleOrders = this.data.orders.filter((order) => {
      if (this.data.activeTab === "history") {
        return order.status === "COMPLETED" || order.status === "CANCELED";
      }
      if (this.data.activeTab === "current") {
        return order.status === "WAITING_PICKUP";
      }
      return true;
    });
    this.setData({
      visibleOrders,
      empty: visibleOrders.length === 0
    });
  },

  cancelOrder(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "取消订单",
      content: "确定取消这笔订单吗？",
      success: (result) => {
        if (!result.confirm) {
          return;
        }
        api.patch("/orders/" + id + "/cancel", {}).then(() => {
          wx.showToast({ title: "已取消", icon: "success" });
          this.loadOrders();
        }).catch((error) => {
          wx.showToast({ title: error.message, icon: "none" });
        });
      }
    });
  },

  repeatOrder(event) {
    api.post("/orders/" + event.currentTarget.dataset.id + "/repeat", {}).then(() => {
      wx.showToast({ title: "已加入购物车", icon: "success" });
      setTimeout(() => {
        wx.navigateTo({ url: "/pages/cart/index" });
      }, 500);
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  goMenu() {
    wx.redirectTo({ url: "/pages/menu/index" });
  }
});
