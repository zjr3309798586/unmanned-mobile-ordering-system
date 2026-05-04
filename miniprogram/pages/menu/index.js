const api = require("../../utils/api");
const auth = require("../../utils/auth");
const format = require("../../utils/format");

Page({
  data: {
    store: null,
    categories: [],
    products: [],
    visibleProducts: [],
    activeCategory: "all",
    keyword: "",
    cartSummary: { items: [], totalAmount: 0, totalQuantity: 0, totalText: "¥ 0.00" },
    productCounts: {},
    cartExpanded: false
  },

  onShow() {
    const keyword = wx.getStorageSync("menuKeyword") || "";
    if (keyword) {
      wx.removeStorageSync("menuKeyword");
    }
    this.setData({ keyword });
    this.loadData();
  },

  loadData() {
    Promise.all([
      api.get("/store"),
      api.get("/categories"),
      api.get("/products"),
      auth.isLoggedIn() ? api.get("/cart") : Promise.resolve({ items: [], totalAmount: 0, totalQuantity: 0 })
    ]).then(([store, categories, products, cartSummary]) => {
      this.setData({
        store,
        categories: categories || [],
        products: (products || []).map(this.decorateProduct),
        cartSummary
      }, () => {
        this.updateProductCounts();
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
    this.filterProducts();
  },

  selectCategory(event) {
    this.setData({ activeCategory: event.currentTarget.dataset.id });
    this.filterProducts();
  },

  filterProducts() {
    const keyword = (this.data.keyword || "").toLowerCase();
    const visibleProducts = this.data.products.filter((product) => {
      const matchCategory = this.data.activeCategory === "all" || product.categoryId === this.data.activeCategory;
      const matchKeyword = !keyword ||
        product.name.toLowerCase().indexOf(keyword) >= 0 ||
        (product.description || "").toLowerCase().indexOf(keyword) >= 0;
      return matchCategory && matchKeyword;
    }).map((product) => ({
      ...product,
      selectedCount: this.data.productCounts[product.id] || 0
    }));
    this.setData({ visibleProducts });
  },

  updateProductCounts() {
    const productCounts = {};
    (this.data.cartSummary.items || []).forEach((item) => {
      productCounts[item.productId] = (productCounts[item.productId] || 0) + item.quantity;
    });
    this.setData({
      productCounts,
      cartSummary: {
        ...this.data.cartSummary,
        totalText: format.money(this.data.cartSummary.totalAmount)
      }
    }, () => {
      this.filterProducts();
    });
  },

  addToCart(event) {
    if (!auth.isLoggedIn()) {
      wx.showToast({ title: "请先登录", icon: "none" });
      wx.switchTab({ url: "/pages/mine/index" });
      return;
    }
    api.post("/cart/items", {
      productId: event.currentTarget.dataset.id,
      spec: "标准杯 / 常温 / 正常糖",
      quantity: 1
    }).then((cartSummary) => {
      this.setData({ cartSummary, cartExpanded: true }, () => {
        this.updateProductCounts();
      });
      wx.showToast({ title: "已加入购物车", icon: "success" });
    }).catch((error) => {
      wx.showToast({ title: error.message, icon: "none" });
    });
  },

  toggleCart() {
    if (this.data.cartSummary.totalQuantity) {
      this.setData({ cartExpanded: !this.data.cartExpanded });
    }
  },

  goDetail(event) {
    wx.navigateTo({
      url: "/pages/detail/index?id=" + event.currentTarget.dataset.id
    });
  },

  goCart() {
    wx.navigateTo({ url: "/pages/cart/index" });
  }
});
