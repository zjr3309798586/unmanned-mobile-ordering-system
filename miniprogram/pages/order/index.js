const api = require("../../utils/api");
const auth = require("../../utils/auth");
const format = require("../../utils/format");

function defaultOrders() {
  return [
    {
      id: "demo-1",
      storeName: "云豹小点·双流北京华联店",
      statusText: "已完成",
      timeText: "2026-03-09 22:14:21",
      pickupNo: "915",
      thumbs: ["/images/menu/menu-product-milk-tea.png", "/images/menu/menu-product-latte.png"],
      amount: "34",
      qty: 2
    },
    {
      id: "demo-2",
      storeName: "云豹小点·双流北京华联店",
      statusText: "已完成",
      timeText: "2025-11-27 11:20:04",
      pickupNo: "535",
      thumbs: ["/images/menu/menu-product-orange.png"],
      amount: "14",
      qty: 1
    },
    {
      id: "demo-3",
      storeName: "云豹小点·双流北京华联店",
      statusText: "已完成",
      timeText: "2025-10-17 15:15:28",
      pickupNo: "576",
      thumbs: ["/images/menu/menu-product-grape.png", "/images/menu/menu-product-wrap.png"],
      amount: "36",
      qty: 2
    }
  ];
}

Page({
  data: {
    tab: "self",
    orders: defaultOrders()
  },

  onShow() {
    if (auth.isLoggedIn && auth.isLoggedIn()) this.loadOrders();
  },

  switchTab(event) {
    this.setData({ tab: event.currentTarget.dataset.tab });
  },

  loadOrders() {
    if (!api || !api.get) return;
    api.get("/orders").then((orders) => {
      if (!Array.isArray(orders) || orders.length === 0) return;
      const decorated = orders.map((o) => ({
        id: o.id,
        storeName: o.storeName || "云豹小点",
        statusText: format.statusText(o.status),
        timeText: (o.createdAt || "").replace("T", " ").slice(0, 19),
        pickupNo: o.pickupNo || o.orderNo || "—",
        thumbs: (o.items || []).map((it) => it.image || "/images/menu/menu-product-milk-tea.png").slice(0, 3),
        amount: String(Math.round(Number(o.payableAmount || 0))),
        qty: (o.items || []).reduce((s, it) => s + (it.quantity || 1), 0)
      }));
      this.setData({ orders: decorated });
    }).catch(() => {});
  },

  repeatOrder(event) {
    const id = event.currentTarget.dataset.id;
    if (!auth.isLoggedIn || !auth.isLoggedIn()) {
      wx.showToast({ title: "演示数据,登录后可再来一单", icon: "none" });
      return;
    }
    api.post("/orders/" + id + "/repeat", {}).then(() => {
      wx.showToast({ title: "已加入购物车", icon: "success" });
      setTimeout(() => { wx.navigateTo({ url: "/pages/cart/index" }); }, 500);
    }).catch((e) => { wx.showToast({ title: e.message, icon: "none" }); });
  }
});
