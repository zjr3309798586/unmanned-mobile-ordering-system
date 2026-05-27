Page({
  data: {
    slideIdx: 0
  },

  onSlide(event) {
    this.setData({ slideIdx: event.detail.current });
  },

  chooseMode(event) {
    var mode = event.currentTarget.dataset.mode;
    try { wx.setStorageSync("orderMode", mode); } catch (e) {}
    wx.redirectTo({ url: "/pages/menu/index" });
  },

  goPickup() {
    wx.redirectTo({ url: "/pages/saving-card/index" });
  }
});
