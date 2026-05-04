const api = require("../../utils/api");
const auth = require("../../utils/auth");
const format = require("../../utils/format");

Page({
  data: {
    store: null,
    categories: [],
    products: [],
    visibleProducts: [],
    groupedProducts: [],
    activeCategory: "all",
    keyword: "",
    promoNote: "正在读取当前可用优惠券...",
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
      api.get("/coupons"),
      auth.isLoggedIn() ? api.get("/cart") : Promise.resolve({ items: [], totalAmount: 0, totalQuantity: 0 })
    ]).then(([store, categories, products, coupons, cartSummary]) => {
      this.setData({
        store,
        categories: categories || [],
        products: (products || []).map(this.decorateProduct),
        promoNote: this.promoText(coupons || []),
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

  promoText(coupons) {
    const coupon = coupons.find((item) => item.available);
    return coupon
      ? coupon.conditionText + "，下单可减 " + format.money(coupon.discountAmount)
      : "当前暂无可用优惠券，下单金额按商品实付计算。";
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
    this.setData({
      visibleProducts,
      groupedProducts: this.groupProducts(visibleProducts)
    });
  },

  groupProducts(products) {
    const categoryNameMap = {};
    this.data.categories.forEach((category) => {
      categoryNameMap[category.id] = category.name;
    });
    const groups = [];
    const groupMap = {};
    products.forEach((product) => {
      const key = product.categoryId || "other";
      if (!groupMap[key]) {
        groupMap[key] = {
          id: key,
          name: this.data.activeCategory === "all" ? (categoryNameMap[key] || "其他商品") : (categoryNameMap[key] || "商品列表"),
          products: []
        };
        groups.push(groupMap[key]);
      }
      groupMap[key].products.push(product);
    });
    return groups;
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
        items: (this.data.cartSummary.items || []).map((item) => ({
          ...item,
          spec: format.specText(item.spec),
          subtotalText: format.money(Number(item.price || 0) * Number(item.quantity || 0))
        })),
        totalText: format.money(this.data.cartSummary.totalAmount)
      }
    }, () => {
      this.filterProducts();
    });
  },

  addToCart(event) {
    if (!auth.isLoggedIn()) {
      wx.showToast({ title: "请先登录", icon: "none" });
      wx.redirectTo({ url: "/pages/mine/index" });
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
