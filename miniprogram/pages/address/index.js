const api = require("../../utils/api");
const auth = require("../../utils/auth");

function emptyForm(defaultAddress) {
  return {
    receiverName: "",
    phone: "",
    addressDetail: "",
    defaultAddress: !!defaultAddress
  };
}

Page({
  data: {
    loggedIn: false,
    selectMode: false,
    addresses: [],
    drawerOpen: false,
    editingId: "",
    form: emptyForm(false)
  },

  onLoad(options) {
    this.setData({ selectMode: options && options.select === "1" });
  },

  onShow() {
    this.setData({ loggedIn: auth.isLoggedIn && auth.isLoggedIn() });
    this.loadAddresses();
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail() {
        wx.redirectTo({ url: "/pages/mine/index" });
      }
    });
  },

  loadAddresses() {
    if (!(auth.isLoggedIn && auth.isLoggedIn())) {
      this.setData({ addresses: [] });
      return;
    }
    api.get("/user/addresses").then((list) => {
      this.setData({ addresses: Array.isArray(list) ? list : [] });
    }).catch((error) => {
      wx.showToast({ title: error.message || "地址加载失败", icon: "none" });
    });
  },

  startAdd() {
    if (!(auth.isLoggedIn && auth.isLoggedIn())) {
      wx.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    this.setData({
      drawerOpen: true,
      editingId: "",
      form: emptyForm(this.data.addresses.length === 0)
    });
  },

  startEdit(event) {
    const id = event.currentTarget.dataset.id;
    const address = this.data.addresses.find((item) => item.id === id);
    if (!address) return;
    this.setData({
      drawerOpen: true,
      editingId: id,
      form: {
        receiverName: address.receiverName || "",
        phone: address.phone || "",
        addressDetail: address.addressDetail || "",
        defaultAddress: !!address.defaultAddress
      }
    });
  },

  closeDrawer() {
    this.setData({ drawerOpen: false });
  },

  noop() {},

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ ["form." + field]: event.detail.value });
  },

  onDefaultChange(event) {
    this.setData({ "form.defaultAddress": event.detail.value });
  },

  saveAddress() {
    const form = this.data.form;
    if (!form.receiverName || !form.phone || !form.addressDetail) {
      wx.showToast({ title: "请填写完整地址", icon: "none" });
      return;
    }
    const request = this.data.editingId
      ? api.put("/user/addresses/" + this.data.editingId, form)
      : api.post("/user/addresses", form);
    request.then(() => {
      wx.showToast({ title: "地址已保存", icon: "success" });
      this.setData({ drawerOpen: false });
      this.loadAddresses();
    }).catch((error) => {
      wx.showToast({ title: error.message || "保存失败", icon: "none" });
    });
  },

  setDefault(event) {
    const id = event.currentTarget.dataset.id;
    api.patch("/user/addresses/" + id + "/default", {}).then(() => {
      this.loadAddresses();
    }).catch((error) => {
      wx.showToast({ title: error.message || "设置失败", icon: "none" });
    });
  },

  deleteAddress(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "删除地址",
      content: "确定删除这个收货地址吗？",
      success: (result) => {
        if (!result.confirm) return;
        api.del("/user/addresses/" + id).then(() => {
          this.loadAddresses();
        }).catch((error) => {
          wx.showToast({ title: error.message || "删除失败", icon: "none" });
        });
      }
    });
  },

  pickAddress(event) {
    const id = event.currentTarget.dataset.id;
    const address = this.data.addresses.find((item) => item.id === id);
    if (!address) return;
    wx.setStorageSync("deliveryAddressId", address.id);
    wx.setStorageSync("deliveryAddress", address.addressDetail || "");
    wx.setStorageSync("deliveryContact", ((address.receiverName || "") + " " + (address.phone || "")).trim());
    wx.showToast({ title: "已选择地址", icon: "success" });
    setTimeout(() => {
      wx.navigateBack({ delta: 1, fail: () => wx.navigateTo({ url: "/pages/cart/index" }) });
    }, 350);
  }
});
