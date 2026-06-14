const api = require("../../utils/api");

const DEFAULT_SLIDES = [
  { id: "local-1", image: "/images/home/home-banner-1.png", title: "", subtitle: "" },
  { id: "local-2", image: "/images/home/home-banner-2.png", title: "", subtitle: "" },
  { id: "local-3", image: "/images/home/home-banner-3.png", title: "", subtitle: "" }
];

function normalizeMiniLink(value) {
  if (!value) return "";
  if (value.indexOf("/pages/") === 0) return value;
  if (value === "/menu.html" || value === "menu.html") return "/pages/menu/index";
  if (value === "/saving-card.html" || value === "saving-card.html") return "/pages/saving-card/index";
  if (value === "/order.html" || value === "order.html") return "/pages/order/index";
  if (value === "/mine.html" || value === "mine.html") return "/pages/mine/index";
  if (value === "/cart.html" || value === "cart.html") return "/pages/cart/index";
  if (/^https?:\/\//.test(value)) return "";
  return value;
}

Page({
  data: {
    slideIdx: 0,
    slides: DEFAULT_SLIDES,
    store: {
      name: "云豹小点·校园店",
      distanceText: "距离 520m",
      statusText: "营业中",
      notice: "夏日新品已上线，营业时间 08:00 - 22:30"
    },
    recommendProducts: [
      { id: "P-1004", name: "云顶轻乳茶", description: "茉莉清香 · 轻盈顺滑", imageUrl: "/images/menu/product-milk-tea.svg", priceText: "15.8", tag: "推荐" },
      { id: "P-1002", name: "海盐拿铁", description: "海盐奶盖 · 咸甜平衡", imageUrl: "/images/menu/product-coconut-latte.svg", priceText: "16.8", tag: "推荐" },
      { id: "P-1001", name: "鲜橙美式", description: "鲜橙清香 · 甘爽解腻", imageUrl: "/images/menu/product-orange-coffee.svg", priceText: "14.8", tag: "推荐" }
    ]
  },

  onLoad() {
    this.loadHomeData();
  },

  onSlide(event) {
    this.setData({ slideIdx: event.detail.current });
  },

  loadHomeData() {
    Promise.all([
      api.get("/store").catch(() => null),
      api.get("/banners").catch(() => []),
      api.get("/smart/recommendations?limit=6").catch(() => api.get("/products").catch(() => []))
    ]).then(([store, banners, products]) => {
      const nextData = {};
      if (store) {
        nextData.store = {
          name: store.name || "云豹小点·校园店",
          distanceText: "距离 " + (store.distance || "520m"),
          statusText: "营业中",
          notice: store.notice || ("营业时间 " + (store.businessHours || "08:00 - 22:30"))
        };
      }
      const remoteSlides = (banners || [])
        .filter((item) => item && item.image)
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          image: api.imageUrl(item.image),
          title: item.title || "",
          subtitle: item.subtitle || "",
          linkUrl: normalizeMiniLink(item.linkUrl || "/pages/menu/index")
        }));
      if (remoteSlides.length) {
        nextData.slides = DEFAULT_SLIDES.concat(remoteSlides).slice(0, 8);
        nextData.slideIdx = 0;
      }
      const productList = (products || []).slice(0, 6).map((item) => {
        const product = item.product || item;
        return {
          id: product.id,
          name: product.name,
          description: item.reason || product.description || "清爽好喝,轻松点单",
          imageUrl: api.imageUrl(product.image),
          priceText: Number(product.price || 0).toFixed(1),
          tag: item.tag || "推荐"
        };
      });
      if (productList.length) {
        nextData.recommendProducts = productList;
      }
      this.setData(nextData);
    });
  },

  chooseMode(event) {
    var mode = event.currentTarget.dataset.mode;
    try { wx.setStorageSync("orderMode", mode); } catch (e) {}
    wx.redirectTo({ url: "/pages/menu/index" });
  },

  openSlide(event) {
    var url = event.currentTarget.dataset.url;
    if (!url) return;
    wx.navigateTo({
      url: url,
      fail: function () {
        wx.redirectTo({ url: url });
      }
    });
  },

  goPickup() {
    wx.redirectTo({ url: "/pages/saving-card/index" });
  }
});
