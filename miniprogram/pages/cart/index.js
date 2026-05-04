const api = require("../../utils/api");
const auth = require("../../utils/auth");
const format = require("../../utils/format");

function decorateCart(cartSummary) {
  const summary = cartSummary || { items: [], totalAmount: 0, totalQuantity: 0 };
  const items = (summary.items || []).map((item) => ({
    ...item,
    imageUrl: api.imageUrl(item.image),
    specText: format.specText(item.spec),
    priceText: format.money(item.price),
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
    needsLogin: true,
    cart: decorateCart(),
    loading: false
  },

  onShow() {
    this.setData({
      loggedIn: auth.isLoggedIn(),
      needsLogin: !auth.isLoggedIn()
    });
    if (auth.isLoggedIn()) {
      this.loadCart();
    }
  },

  login() {
    auth.wechatLogin().then(() => {
      this.setData({ loggedIn: true, needsLogin: false });
      this.loadCart();
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  loadCart() {
    this.setData({ loading: true });
    api.get("/cart").then((cartSummary) => {
      this.setData({ cart: decorateCart(cartSummary) });
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  changeQuantity(event) {
    const id = event.currentTarget.dataset.id;
    const quantity = Number(event.currentTarget.dataset.quantity || 0);
    const delta = Number(event.currentTarget.dataset.delta || 0);
    const nextQuantity = quantity + delta;

    if (nextQuantity <= 0) {
      this.removeItemById(id);
      return;
    }

    api.patch("/cart/items/" + id, { quantity: nextQuantity }).then((cartSummary) => {
      this.setData({ cart: decorateCart(cartSummary) });
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  removeItem(event) {
    this.removeItemById(event.currentTarget.dataset.id);
  },

  removeItemById(id) {
    api.del("/cart/items/" + id).then((cartSummary) => {
      this.setData({ cart: decorateCart(cartSummary) });
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  clearCart() {
    if (this.data.cart.isEmpty) {
      return;
    }
    wx.showModal({
      title: "清空购物车",
      content: "确定删除所有已选商品吗？",
      success: (result) => {
        if (!result.confirm) {
          return;
        }
        api.del("/cart").then((cartSummary) => {
          this.setData({ cart: decorateCart(cartSummary) });
        }).catch((error) => {
          wx.showToast({ title: error.message, icon: "none" });
        });
      }
    });
  },

  goMenu() {
    wx.switchTab({ url: "/pages/menu/index" });
  },

  goSubmit() {
    if (this.data.cart.isEmpty) {
      wx.showToast({ title: "请先选择商品", icon: "none" });
      return;
    }
    wx.navigateTo({ url: "/pages/submit-order/index" });
  }
});
