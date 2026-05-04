function money(value) {
  return "¥ " + Number(value || 0).toFixed(2);
}

function statusText(status) {
  const map = {
    WAITING_PICKUP: "待取餐",
    COMPLETED: "已完成",
    CANCELED: "已取消"
  };
  return map[status] || status || "未知";
}

function pickupTypeText(type) {
  const map = {
    SELF_PICKUP: "到店自取",
    DINE_IN: "堂食",
    DELIVERY: "平台外送"
  };
  return map[type] || type || "到店自取";
}

function specText(value) {
  return value || "标准杯 / 常温 / 正常糖";
}

module.exports = {
  money,
  statusText,
  pickupTypeText,
  specText
};
