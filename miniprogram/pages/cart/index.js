const api = require("../../utils/api");
const auth = require("../../utils/auth");

function defaultAddons() {
  return [
    { id: "a1", name: "葡萄大福", imageUrl: "/images/menu/menu-product-grape.png", priceInt: "3", priceDec: "9", origin: "4.9", save: "1" },
    { id: "a2", name: "龙井马蹄绿豆糕", imageUrl: "/images/menu/menu-product-wrap.png", priceInt: "3", priceDec: "9", origin: "4.9", save: "1" }
  ];
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
    saved: "0.0",

    // 优惠券
    myCoupons: [],          // [{id,title,conditionAmount,discountAmount,conditionText}]
    couponDisplay: [],      // 带 usable + gap 的展示列表
    selectedCouponId: null,
    drNameText: "未选择优惠券",
    drAmountText: "-¥0.0",
    drHintText: "点击右上角选择券",
    drawerOpen: false
  },

  onShow() {
    this.loadAll();
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
        saved: "0.0",
        myCoupons: [],
        selectedCouponId: null,
        drNameText: "未选择优惠券",
        drAmountText: "-¥0.0",
        drHintText: "登录后查看可用优惠券"
      });
      return;
    }

    var p1 = api.get("/cart").catch(function () { return null; });
    var p2 = api.get("/user/coupons").catch(function () { return []; });

    Promise.all([p1, p2]).then(function (res) {
      var cart = res[0] || { items: [], totalAmount: 0, totalQuantity: 0 };
      var rawCoupons = res[1] || [];

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
        return {
          id: c.couponId || c.id,
          title: c.title || "优惠券",
          conditionAmount: Number(c.conditionAmount || 0),
          discountAmount: Number(c.discountAmount || 0),
          conditionText: c.conditionText || ("满 " + (c.conditionAmount || 0) + " 减 " + (c.discountAmount || 0))
        };
      });

      // 自动选最优
      var total = Number(cart.totalAmount || 0);
      if (!total && items.length) {
        total = (cart.items || []).reduce(function (s, it) { return s + Number(it.price || 0) * Number(it.quantity || 1); }, 0);
      }
      var usable = myCoupons.filter(function (c) { return total >= c.conditionAmount; });
      var selectedId = null;
      if (usable.length > 0) {
        usable.sort(function (a, b) { return b.discountAmount - a.discountAmount; });
        selectedId = usable[0].id;
      }

      self.setData({
        items: items,
        isEmpty: items.length === 0,
        totalAmount: total.toFixed(1),
        totalQty: Number(cart.totalQuantity || items.reduce(function (s, it) { return s + Number(it.quantity || 1); }, 0)),
        myCoupons: myCoupons,
        selectedCouponId: selectedId
      });
      self.recalc();
    });
  },

  /* ===== 重算 ===== */
  recalc() {
    var total = Number(this.data.totalAmount || 0);
    var sel = this.getSelectedCoupon();
    var saved = 0;
    if (sel && total >= sel.conditionAmount) saved = sel.discountAmount;
    var pay = Math.max(total - saved, 0);
    var pi = pay.toFixed(1).split(".");

    var drNameText, drAmountText, drHintText;
    if (sel) {
      drNameText = sel.title;
      drAmountText = "-¥" + saved.toFixed(1);
      drHintText = saved > 0 ? "已使用" : ("满 ¥" + sel.conditionAmount.toFixed(0) + " 可用,当前未满");
    } else {
      drNameText = this.data.myCoupons.length > 0 ? "未选择优惠券" : "暂无可用优惠券";
      drAmountText = "-¥0.0";
      drHintText = this.data.myCoupons.length > 0 ? "点击右上角选择券" : "去省钱卡领券更优惠";
    }

    this.setData({
      payInt: pi[0],
      payDec: pi[1] || "0",
      saved: saved.toFixed(1),
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
      var aOk = total >= a.conditionAmount ? 0 : 1;
      var bOk = total >= b.conditionAmount ? 0 : 1;
      if (aOk !== bOk) return aOk - bOk;
      return b.discountAmount - a.discountAmount;
    }).map(function (c) {
      var usable = total >= c.conditionAmount;
      var gap = usable ? "0.0" : (c.conditionAmount - total).toFixed(1);
      return {
        id: c.id,
        title: c.title,
        discountAmount: c.discountAmount,
        conditionText: c.conditionText,
        usable: usable,
        gap: gap
      };
    });
    this.setData({ couponDisplay: list, drawerOpen: true });
  },
  closeDrawer() { this.setData({ drawerOpen: false }); },
  noop() { /* 阻止点击穿透 */ },
  pickCoupon(e) {
    var id = e.currentTarget.dataset.id;
    var usable = e.currentTarget.dataset.usable;
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
  onEdit() { wx.showToast({ title: "编辑模式开发中", icon: "none" }); },
  addAddon() { wx.showToast({ title: "已加购", icon: "success" }); },

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
    var body = { source: "cart", pickupType: "PICKUP" };
    var sel = self.getSelectedCoupon();
    if (sel) {
      var total = Number(self.data.totalAmount || 0);
      if (total >= sel.conditionAmount) body.couponId = sel.id;
    }
    api.post("/orders", body).then(function () {
      wx.showToast({ title: "下单成功", icon: "success" });
      setTimeout(function () { wx.redirectTo({ url: "/pages/order/index" }); }, 500);
    }).catch(function (e) {
      wx.showToast({ title: e.message || "下单失败", icon: "none" });
    });
  }
});
