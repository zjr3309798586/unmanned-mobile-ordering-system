const api = require("../../utils/api");
const auth = require("../../utils/auth");
const format = require("../../utils/format");

const TYPE_OPTIONS = [
  { label: "订单问题", value: "ORDER_ISSUE" },
  { label: "取餐问题", value: "PICKUP_ISSUE" },
  { label: "商品问题", value: "PRODUCT_ISSUE" },
  { label: "意见建议", value: "SUGGESTION" },
  { label: "其他问题", value: "OTHER" }
];

const QUICK_BUTTONS = [
  { key: "pickup", label: "查取餐进度", type: "PICKUP_ISSUE", message: "我想查一下取餐进度。" },
  { key: "coupon", label: "优惠券不能用", type: "OTHER", message: "优惠券或省钱卡怎么使用？" },
  { key: "order", label: "取消/修改订单", type: "ORDER_ISSUE", message: "订单可以取消或修改吗？" },
  { key: "product", label: "商品口味问题", type: "PRODUCT_ISSUE", message: "商品口味或规格有问题怎么办？" }
];

const BOT_REPLIES = {
  UNKNOWN: "我还没看懂你的问题。你可以具体说一下，比如“取餐还要多久”“优惠券为什么不能用”“商品口味不对”。",
  PICKUP_ISSUE: "取餐进度可以在“订单”页查看，一般会显示待制作、待取餐、已完成等状态。如果已经超过预计取餐时间，建议转人工让员工帮你查当前订单。",
  ORDER_ISSUE: "订单取消或修改要看门店是否已经开始制作。未制作时通常可以处理；已经制作后需要员工确认，所以这类问题可以转人工。",
  PRODUCT_ISSUE: "商品口味、规格、漏加料、包装破损等问题，请先保留订单和商品信息。如果需要补做或处理异常，可以转人工。",
  SUGGESTION: "你的建议可以直接发送给我们记录。如果涉及退款、补做、订单异常，建议转人工让员工跟进。",
  OTHER: "优惠券需要满足使用门槛、适用商品和有效期；省钱卡券一般需要先开通省钱卡后领取。你也可以转人工确认具体订单能不能使用。"
};

function statusText(status) {
  const map = {
    PENDING: "待处理",
    REPLIED: "已回复",
    CLOSED: "已关闭"
  };
  return map[status] || status || "未知";
}

function statusClass(status) {
  if (status === "REPLIED") return "replied";
  if (status === "CLOSED") return "closed";
  return "pending";
}

function typeText(type) {
  const item = TYPE_OPTIONS.find((option) => option.value === type);
  return item ? item.label : (type || "其他问题");
}

function shortTime(value) {
  if (!value) return "";
  return String(value).replace("T", " ").substring(0, 16);
}

function chatTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return hour + ":" + minute;
}

function receiptText(status) {
  return status === "PENDING" ? "未读" : "已读";
}

function receiptClass(status) {
  return status === "PENDING" ? "is-unread" : "is-read";
}

function classifyQuestion(content) {
  const text = String(content || "");
  const compact = text.replace(/\s+/g, "");
  if (compact.length < 2 || /^[\d.,，。!?！？]+$/.test(compact)) return "UNKNOWN";
  if (/取餐|拿餐|进度|多久|时间|排队|出餐/.test(text)) return "PICKUP_ISSUE";
  if (/取消|修改|退款|退单|订单|下单|支付/.test(text)) return "ORDER_ISSUE";
  if (/口味|规格|加料|少糖|冰|漏|坏|撒|商品|奶茶|咖啡|轻食/.test(text)) return "PRODUCT_ISSUE";
  if (/建议|意见|反馈|吐槽/.test(text)) return "SUGGESTION";
  return "OTHER";
}

function messageId() {
  return "m" + Date.now() + Math.floor(Math.random() * 10000);
}

Page({
  data: {
    loading: false,
    submitting: false,
    toolsOpen: false,
    typeOptions: TYPE_OPTIONS,
    quickButtons: QUICK_BUTTONS,
    typeIndex: 0,
    selectedTypeLabel: TYPE_OPTIONS[0].label,
    orderOptions: [{ label: "不关联订单", value: "" }],
    orderIndex: 0,
    selectedOrderLabel: "不关联订单",
    content: "",
    contact: "",
    botMessages: [],
    tickets: [],
    countText: "正在加载..."
  },

  onShow() {
    this.ensureLogin().then(() => {
      this.loadPage();
    }).catch((error) => {
      wx.showToast({ title: error.message || "请先登录", icon: "none" });
    });
  },

  ensureLogin() {
    if (auth && auth.isLoggedIn && auth.isLoggedIn()) {
      return Promise.resolve();
    }
    if (auth && auth.devLogin) {
      return auth.devLogin();
    }
    return Promise.reject(new Error("请先登录"));
  },

  loadPage() {
    this.setData({ loading: true });
    Promise.all([
      api.get("/orders").catch(() => []),
      api.get("/support-tickets")
    ]).then((result) => {
      this.renderOrders(result[0] || []);
      this.renderTickets(result[1] || []);
    }).catch((error) => {
      this.setData({ tickets: [], countText: "暂无人工消息" });
      wx.showToast({ title: error.message || "客服记录加载失败", icon: "none" });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  renderOrders(orders) {
    const options = [{ label: "不关联订单", value: "" }].concat((orders || []).slice(0, 20).map((order) => {
      return {
        label: (order.orderNo || order.id || "订单") + " · " + format.money(order.payableAmount || 0),
        value: order.id
      };
    }));
    this.setData({ orderOptions: options, orderIndex: 0, selectedOrderLabel: options[0].label });
  },

  renderTickets(tickets) {
    const list = (tickets || []).map((ticket) => {
      const meta = [
        shortTime(ticket.createdAt),
        ticket.orderNo ? "订单 " + ticket.orderNo : "未关联订单"
      ].filter(Boolean).join(" · ");
      return {
        ...ticket,
        typeText: typeText(ticket.type),
        statusText: statusText(ticket.status),
        statusClass: statusClass(ticket.status),
        meta,
        receiptText: receiptText(ticket.status),
        receiptClass: receiptClass(ticket.status),
        serviceTime: chatTime(ticket.repliedAt || ticket.createdAt),
        replyLabel: ticket.replyContent ? "员工回复" : "已转人工",
        replyText: ticket.replyContent || "员工会在后台看到你的问题，稍后刷新可查看回复。"
      };
    });
    this.setData({
      tickets: list,
      countText: list.length ? "人工消息 " + list.length + " 条" : "暂无人工消息"
    }, () => {
      this.scrollToBottom();
    });
  },

  scrollToBottom() {
    if (!wx.pageScrollTo) return;
    wx.nextTick(() => {
      wx.pageScrollTo({
        scrollTop: 99999,
        duration: 180
      });
    });
  },

  appendUserMessage(content, receipt) {
    const next = this.data.botMessages.concat({
      id: messageId(),
      role: "user",
      content,
      time: chatTime(),
      receiptText: receipt || "已读",
      receiptClass: receipt === "未读" ? "is-unread" : "is-read"
    });
    this.setData({ botMessages: next }, () => {
      this.scrollToBottom();
    });
  },

  appendBotReply(content, withTransfer) {
    const next = this.data.botMessages.concat({
      id: messageId(),
      role: "bot",
      title: "智能助手",
      subtitle: "自动回复",
      content,
      time: chatTime(),
      withTransfer: !!withTransfer
    });
    this.setData({ botMessages: next }, () => {
      this.scrollToBottom();
    });
  },

  askRobot(content, presetType) {
    const text = String(content || "").trim();
    if (!text) return;
    const type = presetType || classifyQuestion(text);
    this.appendUserMessage(text, "已读");
    if (type === "UNKNOWN") {
      this.appendBotReply(BOT_REPLIES.UNKNOWN, false);
      return;
    }
    this.lastQuestionContent = text;
    this.lastQuestionType = type;
    const typeIndex = TYPE_OPTIONS.findIndex((item) => item.value === type);
    this.setData({
      typeIndex: typeIndex >= 0 ? typeIndex : 4,
      selectedTypeLabel: typeText(type)
    });
    api.post("/smart/support-reply", { content: text, type: type })
      .then((result) => {
        if (result && result.type) {
          this.lastQuestionType = result.type;
          const nextIndex = TYPE_OPTIONS.findIndex((item) => item.value === result.type);
          this.setData({
            typeIndex: nextIndex >= 0 ? nextIndex : 4,
            selectedTypeLabel: typeText(result.type)
          });
        }
        this.appendBotReply((result && result.reply) || BOT_REPLIES[type] || BOT_REPLIES.OTHER, true);
      })
      .catch(() => {
        this.appendBotReply(BOT_REPLIES[type] || BOT_REPLIES.OTHER, true);
      });
  },

  askQuick(event) {
    const key = event.currentTarget.dataset.key;
    const preset = QUICK_BUTTONS.find((item) => item.key === key);
    if (!preset) return;
    this.askRobot(preset.message, preset.type);
  },

  transferHuman() {
    const typedContent = (this.data.content || "").trim();
    const finalContent = typedContent || this.lastQuestionContent || "我要转人工，请客服人员联系我。";
    const finalType = typedContent ? classifyQuestion(typedContent) : (this.lastQuestionType || "OTHER");
    if (typedContent) {
      this.appendUserMessage(typedContent, "未读");
    }
    const order = this.data.orderOptions[this.data.orderIndex] || { value: "" };
    this.setData({ submitting: true, content: "" });
    api.post("/support-tickets", {
      type: finalType === "UNKNOWN" ? "OTHER" : finalType,
      orderId: order.value,
      content: "【转人工】" + finalContent,
      contact: (this.data.contact || "").trim()
    }).then(() => {
      wx.showToast({ title: "已转人工", icon: "success" });
      this.appendBotReply("已转人工，员工会在后台看到你的问题。稍后点击刷新，可以查看员工回复。", false);
      this.setData({ contact: "", orderIndex: 0, selectedOrderLabel: "不关联订单" });
      this.loadPage();
    }).catch((error) => {
      wx.showToast({ title: error.message || "提交失败", icon: "none" });
    }).finally(() => {
      this.setData({ submitting: false });
    });
  },

  changeType(event) {
    const index = Number(event.detail.value || 0);
    const option = this.data.typeOptions[index] || TYPE_OPTIONS[0];
    this.setData({ typeIndex: index, selectedTypeLabel: option.label });
  },

  changeOrder(event) {
    const index = Number(event.detail.value || 0);
    const option = this.data.orderOptions[index] || this.data.orderOptions[0];
    this.setData({ orderIndex: index, selectedOrderLabel: option.label });
  },

  inputContent(event) {
    this.setData({ content: event.detail.value });
  },

  inputContact(event) {
    this.setData({ contact: event.detail.value });
  },

  toggleTools() {
    this.setData({ toolsOpen: !this.data.toolsOpen });
  },

  submitTicket() {
    const content = (this.data.content || "").trim();
    if (!content) {
      wx.showToast({ title: "请先输入问题", icon: "none" });
      return;
    }
    if (/转人工|人工|员工/.test(content)) {
      this.transferHuman();
      return;
    }
    this.askRobot(content);
    this.setData({ content: "" });
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail() {
        wx.redirectTo({ url: "/pages/mine/index" });
      }
    });
  }
});
