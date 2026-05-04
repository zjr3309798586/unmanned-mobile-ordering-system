const api = require("../../utils/api");
const auth = require("../../utils/auth");
const format = require("../../utils/format");

Page({
  data: {
    productId: "",
    product: null,
    quantity: 1,
    temperature: "常温",
    sugar: "正常糖",
    toppings: [],
    temperatureOptions: [],
    sugarOptions: [],
    toppingOptions: [],
    totalText: "¥ 0.00"
  },

  onLoad(options) {
    this.setData({ productId: options.id || "" });
    this.updateOptions();
    this.loadProduct();
  },

  loadProduct() {
    const loader = this.data.productId
      ? api.get("/products/" + this.data.productId)
      : api.get("/products").then((products) => products[0]);

    loader.then((product) => {
      this.setData({
        product: {
          ...product,
          imageUrl: api.imageUrl(product.image),
          priceText: format.money(product.price)
        }
      });
      this.updateTotal();
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  updateTotal() {
    const price = this.data.product ? Number(this.data.product.price || 0) : 0;
    this.setData({ totalText: format.money(price * this.data.quantity) });
  },

  updateOptions() {
    this.setData({
      temperatureOptions: ["冰饮", "少冰", "常温"].map((value) => ({
        value,
        active: value === this.data.temperature
      })),
      sugarOptions: ["无糖", "三分糖", "正常糖"].map((value) => ({
        value,
        active: value === this.data.sugar
      })),
      toppingOptions: ["珍珠", "椰果", "奶盖"].map((value) => ({
        value,
        active: this.data.toppings.indexOf(value) >= 0
      }))
    });
  },

  chooseTemperature(event) {
    this.setData({ temperature: event.currentTarget.dataset.value });
    this.updateOptions();
  },

  chooseSugar(event) {
    this.setData({ sugar: event.currentTarget.dataset.value });
    this.updateOptions();
  },

  toggleTopping(event) {
    const value = event.currentTarget.dataset.value;
    const toppings = this.data.toppings.slice();
    const index = toppings.indexOf(value);
    if (index >= 0) {
      toppings.splice(index, 1);
    } else {
      toppings.push(value);
    }
    this.setData({ toppings });
    this.updateOptions();
  },

  changeQuantity(event) {
    const next = Math.max(1, this.data.quantity + Number(event.currentTarget.dataset.delta));
    this.setData({ quantity: next });
    this.updateTotal();
  },

  selectedSpec() {
    const parts = ["标准杯", this.data.temperature, this.data.sugar].concat(this.data.toppings);
    return parts.join(" / ");
  },

  addToCart(event) {
    if (!auth.isLoggedIn()) {
      wx.showToast({ title: "请先登录", icon: "none" });
      wx.switchTab({ url: "/pages/mine/index" });
      return;
    }
    api.post("/cart/items", {
      productId: this.data.product.id,
      spec: this.selectedSpec(),
      quantity: this.data.quantity
    }).then(() => {
      wx.showToast({ title: "已加入购物车", icon: "success" });
      if (event.currentTarget.dataset.buy === "true") {
        wx.navigateTo({ url: "/pages/submit-order/index" });
      }
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  }
});
