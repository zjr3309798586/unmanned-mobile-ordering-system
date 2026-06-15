const api = require("../../utils/api");
const auth = require("../../utils/auth");

const DELIVERY_FEE = 3;
const DELIVERY_FREE_THRESHOLD = 35;

function deliveryFeeFor(total, pickupType) {
  if (pickupType !== "DELIVERY") return 0;
  return Number(total || 0) >= DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_FEE;
}

function defaultAddons() {
  return [
    { id: "P-1003", name: "满杯西柚绿茶", imageUrl: "/images/menu/product-grapefruit-tea.svg", priceInt: "13", priceDec: "9", origin: "", save: "搭配推荐" },
    { id: "P-1006", name: "芝士烤吐司", imageUrl: "/images/menu/product-toast.svg", priceInt: "9", priceDec: "9", origin: "", save: "搭配推荐" }
  ];
}

function buildAddons(products, cartItems) {
  var inCart = {};
  (cartItems || []).forEach(function (it) { inCart[it.productId] = true; });
  var source = (products || []).filter(function (p) {
    return p.enabled !== false && !inCart[p.id];
  });
  if (source.length === 0) source = products || [];
  var list = source.slice(0, 2);
  if (list.length === 0) return defaultAddons();
  return list.map(function (p) {
    var price = Number(p.price || 0).toFixed(1).split(".");
    return {
      id: p.id,
      name: p.name,
      imageUrl: p.image ? api.imageUrl(p.image) : "/images/common/food-placeholder.svg",
      priceInt: price[0],
      priceDec: price[1],
      origin: "",
      save: "搭配推荐"
    };
  });
}

function normalizeCouponSuggestion(item) {
  var source = item.coupon || item;
  var min = Number(source.minAmount != null ? source.minAmount : (source.conditionAmount || 0));
  return {
    id: source.couponId || source.id,
    title: source.title || "优惠券",
    conditionAmount: min,
    discountAmount: Number(source.discountAmount || 0),
    conditionText: source.conditionText || ("满 " + min + " 减 " + (source.discountAmount || 0)),
    usable: !!item.usable,
    gapAmount: Number(item.gapAmount || 0),
    reason: item.reason || ""
  };
}

function autoPickCoupon(coupons, total) {
  var usable = (coupons || []).filter(function (c) {
    if (typeof c.usable === "boolean") return c.usable;
    return total >= c.conditionAmount;
  });
  if (usable.length === 0) return null;
  usable.sort(function (a, b) { return b.discountAmount - a.discountAmount; });
  return usable[0].id;
}

Page({
  data: {
    items: [],
    addons: defaultAddons(),
    isEmpty: true,
    totalQty: 0,
    totalAmount: "0.0",
    payInt: "0",
    payDec: "0",
    payOrigin: "0.0",
    saved: "0.0",
    deliveryFee: "0.0",
    deliveryFeeText: "到店自取免配送费",

    // 优惠券
    myCoupons: [],          // [{id,title,conditionAmount,discountAmount,conditionText}]
    couponDisplay: [],      // 带 usable + gap 的展示列表
    selectedCouponId: null,
    drNameText: "未选择优惠券",
    drAmountText: "-¥0.0",
    drHintText: "点击右上角选择券",
    drawerOpen: false,
    storeName: "云豹小点·校园店",
    storeAddress: "门店信息加载中",
    queueCupCount: 0,
    queueOrderCount: 0,
    pickupType: "SELF_PICKUP",
    pickupTypeText: "自取",
    selectedAddress: null,
    addressTitle: "未选择配送地址",
    addressDesc: "可从地址簿选择，也可以在下方临时填写",
    deliveryAddress: "",
    deliveryContact: ""
  },

  onShow() {
    var pickupType = wx.getStorageSync("orderMode") === "delivery" ? "DELIVERY" : "SELF_PICKUP";
    this.setData({
      pickupType: pickupType,
      pickupTypeText: pickupType === "DELIVERY" ? "外送" : "自取"
    });
    this.loadStoreQueue();
    this.loadAddressBook();
    this.loadAll();
  },

  loadStoreQueue() {
    api.get("/store").then((store) => {
      this.setData({
        storeName: store && store.name ? store.name : this.data.storeName,
        storeAddress: store && store.address ? store.address : this.data.storeAddress,
        queueCupCount: Number(store && store.queueCupCount != null ? store.queueCupCount : 0),
        queueOrderCount: Number(store && store.queueOrderCount != null ? store.queueOrderCount : 0)
      });
    }).catch(() => {});
  },

  loadAddressBook() {
    if (!(auth.isLoggedIn && auth.isLoggedIn())) {
      this.setData({
        selectedAddress: null,
        addressTitle: "未选择配送地址",
        addressDesc: "请先登录后选择地址",
        deliveryAddress: wx.getStorageSync("deliveryAddress") || "",
        deliveryContact: wx.getStorageSync("deliveryContact") || ""
      });
      return;
    }
    api.get("/user/addresses").then((list) => {
      const addresses = Array.isArray(list) ? list : [];
      const selectedId = wx.getStorageSync("deliveryAddressId") || "";
      const matched = addresses.find((item) => item.id === selectedId);
      const defaultAddress = addresses.find((item) => item.defaultAddress);
      const address = matched || defaultAddress || addresses[0] || null;
      if (!address) {
        this.setData({
          selectedAddress: null,
          addressTitle: "未选择配送地址",
          addressDesc: "可从地址簿选择，也可以在下方临时填写",
          deliveryAddress: wx.getStorageSync("deliveryAddress") || "",
          deliveryContact: wx.getStorageSync("deliveryContact") || ""
        });
        return;
      }
      const deliveryAddress = address.addressDetail || "";
      const deliveryContact = address.phone || "";
      wx.setStorageSync("deliveryAddressId", address.id);
      wx.setStorageSync("deliveryAddress", deliveryAddress);
      wx.setStorageSync("deliveryContact", deliveryContact);
      this.setData({
        selectedAddress: address,
        addressTitle: (address.receiverName || "收货人") + " " + (address.phone || ""),
        addressDesc: address.addressDetail || "未填写详细地址",
        deliveryAddress,
        deliveryContact
      });
    }).catch(() => {
      this.setData({
        selectedAddress: null,
        addressTitle: "地址加载失败",
        addressDesc: "请检查后端服务或稍后重试",
        deliveryAddress: wx.getStorageSync("deliveryAddress") || "",
        deliveryContact: wx.getStorageSync("deliveryContact") || ""
      });
    });
  },

  /* ===== 拉数据 ===== */
  loadAll() {
    var self = this;
    if (!(auth.isLoggedIn && auth.isLoggedIn())) {
      self.setData({
        items: [],
        isEmpty: true,
        totalQty: 0,
        totalAmount: "0.0",
        payInt: "0",
        payDec: "0",
        payOrigin: "0.0",
        saved: "0.0",
        deliveryFee: "0.0",
        deliveryFeeText: "到店自取免配送费",
        myCoupons: [],
        selectedCouponId: null,
        drNameText: "未选择优惠券",
        drAmountText: "-¥0.0",
        drHintText: "登录后查看可用优惠券"
      });
      api.get("/products")
        .then(function (products) { self.setData({ addons: buildAddons(products || [], []) }); })
        .catch(function () {});
      return;
    }

    var p1 = api.get("/cart").catch(function () { return null; });
    var p2 = api.get("/user/coupons").catch(function () { return []; });
    var p3 = api.get("/products").catch(function () { return []; });

    Promise.all([p1, p2, p3]).then(function (res) {
      var cart = res[0] || { items: [], totalAmount: 0, totalQuantity: 0 };
      var rawCoupons = res[1] || [];
      var products = res[2] || [];

      // 商品列表
      var items = (cart.items || []).map(function (it) {
        var sub = Number(it.subtotal != null ? it.subtotal : Number(it.price) * Number(it.quantity)) || 0;
        return {
          id: it.id,
          name: it.productName || it.name || "商品",
          imageUrl: it.image ? api.imageUrl(it.image) : "/images/menu/menu-product-milk-tea.png",
          priceText: sub.toFixed(1),
          specText: it.specText || (typeof it.spec === "string" ? it.spec : "标准杯"),
          promoText: it.promoText || "",
          quantity: it.quantity,
          isNew: it.isNew
        };
      });

      // 可用券
      var myCoupons = rawCoupons.filter(function (c) {
        return c.status === "AVAILABLE" || !c.status;
      }).map(function (c) {
        var min = Number(c.minAmount != null ? c.minAmount : (c.conditionAmount || 0));
        return {
          id: c.couponId || c.id,
          title: c.title || "优惠券",
          conditionAmount: min,
          discountAmount: Number(c.discountAmount || 0),
          conditionText: c.conditionText || ("满 " + min + " 减 " + (c.discountAmount || 0))
        };
      });

      var total = Number(cart.totalAmount || 0);
      if (!total && items.length) {
        total = (cart.items || []).reduce(function (s, it) { return s + Number(it.price || 0) * Number(it.quantity || 1); }, 0);
      }
      api.get("/smart/coupons?amount=" + encodeURIComponent(total))
        .then(function (suggestions) {
          if (suggestions && suggestions.length) {
            myCoupons = suggestions.map(normalizeCouponSuggestion);
          }
        })
        .catch(function () {})
        .then(function () {
          self.setData({
            items: items,
            isEmpty: items.length === 0,
            totalAmount: total.toFixed(1),
            totalQty: Number(cart.totalQuantity || items.reduce(function (s, it) { return s + Number(it.quantity || 1); }, 0)),
            myCoupons: myCoupons,
            selectedCouponId: autoPickCoupon(myCoupons, total),
            addons: buildAddons(products, cart.items || [])
          });
          self.recalc();
        });
    });
  },

  /* ===== 重算 ===== */
  recalc() {
    var total = Number(this.data.totalAmount || 0);
    var sel = this.getSelectedCoupon();
    var saved = 0;
    if (sel && total >= sel.conditionAmount) saved = sel.discountAmount;
    var deliveryFee = deliveryFeeFor(total, this.data.pickupType);
    var pay = Math.max(total - saved, 0) + deliveryFee;
    var pi = pay.toFixed(1).split(".");
    var payOrigin = total + deliveryFee;
    var deliveryFeeText = this.data.pickupType === "DELIVERY"
      ? (deliveryFee > 0
        ? "本单配送费 ¥" + deliveryFee.toFixed(1) + "，商品满 ¥" + DELIVERY_FREE_THRESHOLD + " 免配送费"
        : "已满足免配送费，本单外送费 ¥0")
      : "到店自取免配送费";

    var drNameText, drAmountText, drHintText;
    if (sel) {
      drNameText = sel.title;
      drAmountText = "-¥" + saved.toFixed(1);
      drHintText = saved > 0 ? (sel.reason || "智能已选最优券") : ("满 ¥" + sel.conditionAmount.toFixed(0) + " 可用,当前未满");
    } else {
      drNameText = this.data.myCoupons.length > 0 ? "未选择优惠券" : "暂无可用优惠券";
      drAmountText = "-¥0.0";
      drHintText = this.data.myCoupons[0] && this.data.myCoupons[0].reason
        ? this.data.myCoupons[0].reason
        : (this.data.myCoupons.length > 0 ? "点击右上角选择券" : "去省钱卡领券更优惠");
    }

    this.setData({
      payInt: pi[0],
      payDec: pi[1] || "0",
      payOrigin: payOrigin.toFixed(1),
      saved: saved.toFixed(1),
      deliveryFee: deliveryFee.toFixed(1),
      deliveryFeeText: deliveryFeeText,
      pickupTypeText: this.data.pickupType === "DELIVERY" ? "外送" : "自取",
      drNameText: drNameText,
      drAmountText: drAmountText,
      drHintText: drHintText
    });
  },

  getSelectedCoupon() {
    var id = this.data.selectedCouponId;
    if (!id) return null;
    var arr = this.data.myCoupons || [];
    for (var i = 0; i < arr.length; i++) {
      if (String(arr[i].id) === String(id)) return arr[i];
    }
    return null;
  },

  /* ===== 抽屉 ===== */
  openDrawer() {
    if (!(auth.isLoggedIn && auth.isLoggedIn())) {
      wx.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    var total = Number(this.data.totalAmount || 0);
    // 全部展示,可用排前面,不可用置灰 + 还差 ¥X
    var list = (this.data.myCoupons || []).slice().sort(function (a, b) {
      var aUsable = typeof a.usable === "boolean" ? a.usable : total >= a.conditionAmount;
      var bUsable = typeof b.usable === "boolean" ? b.usable : total >= b.conditionAmount;
      var aOk = aUsable ? 0 : 1;
      var bOk = bUsable ? 0 : 1;
      if (aOk !== bOk) return aOk - bOk;
      return b.discountAmount - a.discountAmount;
    }).map(function (c) {
      var usable = typeof c.usable === "boolean" ? c.usable : total >= c.conditionAmount;
      var gapValue = usable ? 0 : (c.gapAmount || (c.conditionAmount - total));
      return {
        id: c.id,
        title: c.title,
        discountAmount: c.discountAmount,
        conditionText: c.reason || c.conditionText,
        usable: usable,
        gap: gapValue.toFixed(1)
      };
    });
    this.setData({ couponDisplay: list, drawerOpen: true });
  },
  closeDrawer() { this.setData({ drawerOpen: false }); },
  noop() { /* 阻止点击穿透 */ },
  pickCoupon(e) {
    var id = e.currentTarget.dataset.id;
    var usable = e.currentTarget.dataset.usable;
    usable = usable === true || usable === "true" || usable === 1 || usable === "1";
    var gap = e.currentTarget.dataset.gap;
    if (!usable) {
      wx.showToast({ title: "还差 ¥" + gap + " 可用", icon: "none" });
      return;
    }
    this.setData({ selectedCouponId: id, drawerOpen: false });
    this.recalc();
  },
  clearCoupon() {
    this.setData({ selectedCouponId: null, drawerOpen: false });
    this.recalc();
  },

  /* ===== 其他交互 ===== */
  goBack() {
    wx.navigateBack({ delta: 1, fail: function () { wx.redirectTo({ url: "/pages/menu/index" }); } });
  },
  goMenu() { wx.redirectTo({ url: "/pages/menu/index" }); },
  switchPickupType(event) {
    var type = event.currentTarget.dataset.type === "DELIVERY" ? "DELIVERY" : "SELF_PICKUP";
    wx.setStorageSync("orderMode", type === "DELIVERY" ? "delivery" : "pickup");
    this.setData({
      pickupType: type,
      pickupTypeText: type === "DELIVERY" ? "外送" : "自取"
    });
    if (type === "DELIVERY") {
      this.loadAddressBook();
    }
    this.recalc();
  },
  chooseAddress() { wx.navigateTo({ url: "/pages/address/index?select=1" }); },
  inputDeliveryAddress(event) {
    const value = event.detail.value || "";
    this.setData({ deliveryAddress: value });
    wx.setStorageSync("deliveryAddress", value);
  },
  inputDeliveryContact(event) {
    const value = event.detail.value || "";
    this.setData({ deliveryContact: value });
    wx.setStorageSync("deliveryContact", value);
  },
  onEdit() { this.clearCart(); },
  addAddon(event) {
    var id = event.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: "/pages/detail/index?id=" + id });
  },

  onPay() {
    var self = this;
    if (!(auth.isLoggedIn && auth.isLoggedIn())) {
      wx.showToast({ title: "请先登录", icon: "none" });
      setTimeout(function () { wx.redirectTo({ url: "/pages/mine/index" }); }, 500);
      return;
    }
    if (!self.data.items || self.data.items.length === 0) {
      wx.showToast({ title: "购物车为空", icon: "none" });
      return;
    }
    var orderMode = wx.getStorageSync("orderMode");
    var pickupType = orderMode === "delivery" ? "DELIVERY" : "SELF_PICKUP";
    var body = { source: "cart", pickupType: pickupType };
    if (pickupType === "DELIVERY") {
      body.deliveryAddress = this.data.deliveryAddress || wx.getStorageSync("deliveryAddress") || "";
      body.deliveryContact = this.data.deliveryContact || wx.getStorageSync("deliveryContact") || "";
      if (!body.deliveryAddress || !body.deliveryContact) {
        wx.showToast({ title: "请先选择收货地址", icon: "none" });
        setTimeout(function () { wx.navigateTo({ url: "/pages/address/index?select=1" }); }, 500);
        return;
      }
    } else {
      body.tableNo = "自取";
    }
    var sel = self.getSelectedCoupon();
    if (sel) {
      var total = Number(self.data.totalAmount || 0);
      if (total >= sel.conditionAmount) body.couponId = sel.id;
    }
    wx.showModal({
      title: "确认支付",
      content: "确认支付 ¥" + self.data.payInt + "." + self.data.payDec + " 吗？",
      confirmText: "确认支付",
      cancelText: "再想想",
      success: function (res) {
        if (!res.confirm) return;
        api.post("/orders", body).then(function () {
          wx.showToast({ title: "下单成功", icon: "success" });
          setTimeout(function () { wx.redirectTo({ url: "/pages/order/index" }); }, 500);
        }).catch(function (e) {
          wx.showToast({ title: e.message || "下单失败", icon: "none" });
        });
      }
    });
  }
});
