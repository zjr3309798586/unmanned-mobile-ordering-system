const api = require("../../utils/api");
const auth = require("../../utils/auth");
const format = require("../../utils/format");

const PICKUP_TYPES = [
  { id: "SELF_PICKUP", name: "到店自取", desc: "下单后凭取餐号到店取餐" },
  { id: "DINE_IN", name: "堂食", desc: "填写桌号后送到指定座位" },
  { id: "DELIVERY", name: "平台外送", desc: "外送信息后续接平台配送" }
];

function decorateCart(cartSummary) {
  const summary = cartSummary || { items: [], totalAmount: 0, totalQuantity: 0 };
  const items = (summary.items || []).map((item) => ({
    ...item,
    imageUrl: api.imageUrl(item.image),
    specText: format.specText(item.spec),
    subtotalText: format.money(Number(item.price || 0) * Number(item.quantity || 0))
  }));
  return {
    ...summary,
    items,
    totalText: format.money(summary.totalAmount),
    isEmpty: items.length === 0
  };
}

Page({
  data: {
    loggedIn: false,
    store: null,
    cart: decorateCart(),
    pickupType: "SELF_PICKUP",
    pickupTypes: [],
    coupons: [],
    selectedCouponId: "",
    selectedCoupon: null,
    tableNo: "",
    remark: "",
    discountText: "¥ 0.00",
    payableText: "¥ 0.00",
    submitting: false
  },

  onShow() {
    this.setData({ loggedIn: auth.isLoggedIn() });
    this.updatePickupTypes();
    if (!auth.isLoggedIn()) {
      wx.showToast({ title: "请先登录", icon: "none" });
      wx.redirectTo({ url: "/pages/mine/index" });
      return;
    }
    this.loadData();
  },

  loadData() {
    Promise.all([
      api.get("/store"),
      api.get("/cart"),
      api.get("/coupons")
    ]).then(([store, cartSummary, coupons]) => {
      const cart = decorateCart(cartSummary);
      this.setData({
        store,
        cart,
        coupons: (coupons || []).filter((coupon) => coupon.available).map((coupon) => ({
          ...coupon,
          discountText: format.money(coupon.discountAmount),
          active: false
        })),
        selectedCouponId: "",
        selectedCoupon: null
      });
      this.updateAmount();
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  updatePickupTypes() {
    this.setData({
      pickupTypes: PICKUP_TYPES.map((item) => ({
        ...item,
        active: item.id === this.data.pickupType
      }))
    });
  },

  selectPickup(event) {
    this.setData({ pickupType: event.currentTarget.dataset.id });
    this.updatePickupTypes();
  },

  selectCoupon(event) {
    const couponId = event.currentTarget.dataset.id || "";
    const selectedCoupon = this.data.coupons.find((coupon) => coupon.id === couponId) || null;
    this.setData({
      selectedCouponId: couponId,
      selectedCoupon,
      coupons: this.data.coupons.map((coupon) => ({
        ...coupon,
        active: coupon.id === couponId
      }))
    });
    this.updateAmount();
  },

  updateAmount() {
    const totalAmount = Number(this.data.cart.totalAmount || 0);
    const discountAmount = this.data.selectedCoupon
      ? Math.min(Number(this.data.selectedCoupon.discountAmount || 0), totalAmount)
      : 0;
    const payableAmount = Math.max(totalAmount - discountAmount, 0);
    this.setData({
      discountText: format.money(discountAmount),
      payableText: format.money(payableAmount)
    });
  },

  onTableInput(event) {
    this.setData({ tableNo: event.detail.value });
  },

  onRemarkInput(event) {
    this.setData({ remark: event.detail.value });
  },

  submitOrder() {
    if (this.data.cart.isEmpty) {
      wx.showToast({ title: "购物车为空", icon: "none" });
      return;
    }
    if (this.data.submitting) {
      return;
    }
    this.setData({ submitting: true });
    api.post("/orders", {
      pickupType: this.data.pickupType,
      couponId: this.data.selectedCouponId || null,
      tableNo: this.data.tableNo,
      remark: this.data.remark
    }).then((order) => {
      wx.setStorageSync("latestOrderId", order.id);
      wx.showToast({ title: "订单已提交", icon: "success" });
      setTimeout(() => {
        wx.redirectTo({ url: "/pages/order/index" });
      }, 500);
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    }).finally(() => {
      this.setData({ submitting: false });
    });
  },

  goCart() {
    wx.redirectTo({ url: "/pages/cart/index" });
  }
});
