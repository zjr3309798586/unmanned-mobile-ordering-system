document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var form = document.querySelector("[data-support-form]");
  var typeNode = document.querySelector("[data-support-type]");
  var orderNode = document.querySelector("[data-support-order]");
  var contentNode = document.querySelector("[data-support-content]");
  var contactNode = document.querySelector("[data-support-contact]");
  var submitNode = document.querySelector("[data-support-submit]");
  var botThread = document.querySelector("[data-bot-thread]");
  var composerTools = document.querySelector("[data-composer-tools]");
  var composerToggle = document.querySelector("[data-composer-more-toggle]");
  var refreshNode = document.querySelector("[data-support-refresh]");
  var loadingNode = document.querySelector("[data-support-loading]");
  var listNode = document.querySelector("[data-support-list]");
  var emptyNode = document.querySelector("[data-support-empty]");
  var lastQuestionContent = "";
  var lastQuestionType = "OTHER";

  var BOT_REPLIES = {
    UNKNOWN: "我还没看懂你的问题。你可以具体说一下，比如“取餐还要多久”“优惠券为什么不能用”“商品口味不对”。",
    PICKUP_ISSUE: "取餐进度可以在“订单”页查看，一般会显示待制作、待取餐、已完成等状态。如果已经超过预计取餐时间，建议转人工让员工帮你查当前订单。",
    ORDER_ISSUE: "订单取消或修改要看门店是否已经开始制作。未制作时通常可以处理；已经制作后需要员工确认，所以这类问题可以转人工。",
    PRODUCT_ISSUE: "商品口味、规格、漏加料、包装破损等问题，请先保留订单和商品信息。如果需要补做或处理异常，可以转人工。",
    SUGGESTION: "你的建议可以直接发送给我们记录。如果涉及退款、补做、订单异常，建议转人工让员工跟进。",
    OTHER: "优惠券需要满足使用门槛、适用商品和有效期；省钱卡券一般需要先开通省钱卡后领取。你也可以转人工确认具体订单能不能使用。"
  };

  var BOT_QUICK = {
    pickup: {
      type: "PICKUP_ISSUE",
      message: "我想查一下取餐进度。"
    },
    coupon: {
      type: "OTHER",
      message: "优惠券或省钱卡怎么使用？"
    },
    order: {
      type: "ORDER_ISSUE",
      message: "订单可以取消或修改吗？"
    },
    product: {
      type: "PRODUCT_ISSUE",
      message: "商品口味或规格有问题怎么办？"
    }
  };

  function escapeHtml(value) {
    if (app && app.escapeHtml) return app.escapeHtml(value);
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function ensureLogin() {
    if (!app || !app.isLoggedIn) {
      return Promise.reject(new Error("页面初始化失败"));
    }
    if (app.isLoggedIn()) {
      return Promise.resolve();
    }
    return app.devLogin ? app.devLogin("游客用户") : Promise.reject(new Error("请先登录"));
  }

  function setLoading(on) {
    if (loadingNode) loadingNode.style.display = on ? "block" : "none";
  }

  function setSubmitLoading(on) {
    if (!submitNode) return;
    submitNode.disabled = on;
    submitNode.textContent = on ? "提交中..." : "发送";
  }

  function showMessage(text) {
    if (app && app.showMessage) app.showMessage(text);
  }

  function typeText(type) {
    var map = {
      ORDER_ISSUE: "订单问题",
      PICKUP_ISSUE: "取餐问题",
      PRODUCT_ISSUE: "商品问题",
      SUGGESTION: "意见建议",
      OTHER: "其他问题"
    };
    return map[type] || type || "其他问题";
  }

  function statusText(status) {
    var map = {
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

  function formatTime(value) {
    if (!value) return "";
    return String(value).replace("T", " ").substring(0, 16);
  }

  function formatChatTime(value) {
    var date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "";
    var hour = String(date.getHours()).padStart(2, "0");
    var minute = String(date.getMinutes()).padStart(2, "0");
    return hour + ":" + minute;
  }

  function receiptText(status) {
    return status === "PENDING" ? "未读" : "已读";
  }

  function receiptClass(status) {
    return status === "PENDING" ? "is-unread" : "is-read";
  }

  var scrollTimer = null;

  function scrollChatToBottom() {
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(function () {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
    }, 60);
  }

  function classifyQuestion(content) {
    var text = String(content || "");
    var compact = text.replace(/\s+/g, "");
    if (compact.length < 2 || /^[\d.,，。!?！？]+$/.test(compact)) return "UNKNOWN";
    if (/取餐|拿餐|进度|多久|时间|排队|出餐/.test(text)) return "PICKUP_ISSUE";
    if (/取消|修改|退款|退单|订单|下单|支付/.test(text)) return "ORDER_ISSUE";
    if (/口味|规格|加料|少糖|冰|漏|坏|撒|商品|奶茶|咖啡|轻食/.test(text)) return "PRODUCT_ISSUE";
    if (/建议|意见|反馈|吐槽/.test(text)) return "SUGGESTION";
    return "OTHER";
  }

  function renderOrders(orders) {
    var list = Array.isArray(orders) ? orders : [];
    if (!orderNode) return;
    var html = '<option value="">不关联订单</option>';
    html += list.slice(0, 20).map(function (order) {
      var amount = app && app.money ? app.money(order.payableAmount).replace(".00", "") : order.payableAmount;
      var label = (order.orderNo || order.id || "订单") + " · " + amount;
      return '<option value="' + escapeHtml(order.id) + '">' + escapeHtml(label) + '</option>';
    }).join("");
    orderNode.innerHTML = html;
  }

  function appendUserMessage(text, receipt) {
    if (!botThread) return;
    var messageReceipt = receipt || "已读";
    botThread.insertAdjacentHTML("beforeend", [
      '<article class="support-chat-item is-live-user">',
      '  <div class="support-bubble-row is-user">',
      '    <div class="support-bubble">',
      '      <p>' + escapeHtml(text) + '</p>',
      '      <small class="message-footer"><span>' + escapeHtml(formatChatTime()) + '</span><span class="message-receipt ' + (messageReceipt === "未读" ? "is-unread" : "is-read") + '">' + escapeHtml(messageReceipt) + '</span></small>',
      '    </div>',
      '  </div>',
      '</article>'
    ].join(""));
    scrollChatToBottom();
  }

  function appendBotReply(text, withTransfer) {
    if (!botThread) return;
    var actions = withTransfer ? [
      '<div class="bot-action-row">',
      '  <button class="is-primary" type="button" data-transfer-human>没解决，转人工</button>',
      '</div>'
    ].join("") : "";

    botThread.insertAdjacentHTML("beforeend", [
      '<article class="support-chat-item is-live-bot">',
      '  <div class="support-bubble-row is-service">',
      '    <img class="support-avatar" src="../images/mascot/mascot-yunbao-144.png" alt="智能助手">',
      '    <div class="support-bubble support-bot-bubble">',
      '      <div class="bubble-head"><span>智能助手</span><em>自动回复</em></div>',
      '      <p>' + escapeHtml(text) + '</p>',
      '      <small class="service-time">' + escapeHtml(formatChatTime()) + '</small>',
      actions,
      '    </div>',
      '  </div>',
      '</article>'
    ].join(""));
    scrollChatToBottom();
  }

  function askRobot(message, presetType) {
    var content = String(message || "").trim();
    if (!content) return;
    var type = presetType || classifyQuestion(content);
    if (type === "UNKNOWN") {
      appendUserMessage(content, "已读");
      appendBotReply(BOT_REPLIES.UNKNOWN, false);
      return;
    }
    lastQuestionContent = content;
    lastQuestionType = type;
    if (typeNode) typeNode.value = type;
    appendUserMessage(content, "已读");
    if (app && app.post) {
      app.post("/smart/support-reply", { content: content, type: type })
        .then(function (result) {
          if (result && result.type) {
            lastQuestionType = result.type;
            if (typeNode) typeNode.value = result.type;
          }
          appendBotReply((result && result.reply) || BOT_REPLIES[type] || BOT_REPLIES.OTHER, true);
        })
        .catch(function () {
          appendBotReply(BOT_REPLIES[type] || BOT_REPLIES.OTHER, true);
        });
      return;
    }
    appendBotReply(BOT_REPLIES[type] || BOT_REPLIES.OTHER, true);
  }

  function ticketCard(ticket) {
    var meta = [
      formatTime(ticket.createdAt),
      ticket.orderNo ? "订单 " + ticket.orderNo : "未关联订单"
    ].filter(Boolean).join(" · ");
    var replyText = ticket.replyContent || "已收到，员工会在后台查看并尽快回复。";
    var replyStatus = ticket.replyContent ? "员工回复" : "已转人工";
    var receipt = receiptText(ticket.status);
    var receiptCls = receiptClass(ticket.status);
    return [
      '<article class="support-chat-item">',
      '  <div class="support-bubble-row is-user">',
      '    <div class="support-bubble">',
      '      <div class="bubble-head"><span>' + escapeHtml(typeText(ticket.type)) + '</span><em>' + escapeHtml(statusText(ticket.status)) + '</em></div>',
      '      <p>' + escapeHtml(ticket.content) + '</p>',
      '      <small class="message-footer"><span>' + escapeHtml(meta) + '</span><span class="message-receipt ' + receiptCls + '">' + escapeHtml(receipt) + '</span></small>',
      '    </div>',
      '  </div>',
      '  <div class="support-bubble-row is-service">',
      '    <img class="support-avatar" src="../images/mascot/mascot-yunbao-144.png" alt="">',
      '    <div class="support-bubble ' + statusClass(ticket.status) + '">',
      '      <div class="bubble-head"><span>' + escapeHtml(replyStatus) + '</span></div>',
      '      <p>' + escapeHtml(replyText) + '</p>',
      '      <small class="service-time">' + escapeHtml(formatChatTime(ticket.repliedAt || ticket.createdAt)) + '</small>',
      '    </div>',
      '  </div>',
      '</article>'
    ].join("");
  }

  function renderTickets(tickets) {
    var list = Array.isArray(tickets)
      ? tickets.slice().sort(function (a, b) {
        return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
      })
      : [];
    if (!list.length) {
      if (listNode) listNode.innerHTML = "";
      if (emptyNode) emptyNode.hidden = false;
      return;
    }
    if (emptyNode) emptyNode.hidden = true;
    if (listNode) listNode.innerHTML = list.map(ticketCard).join("");
  }

  function loadPage() {
    setLoading(true);
    return Promise.all([
      app.get("/orders").catch(function () { return []; }),
      app.get("/support-tickets")
    ]).then(function (result) {
      renderOrders(result[0]);
      renderTickets(result[1]);
    }).catch(function (error) {
      renderTickets([]);
      showMessage(error.message || "客服记录加载失败");
    }).finally(function () {
      setLoading(false);
    });
  }

  function resetHumanForm() {
    if (contactNode) contactNode.value = "";
    if (orderNode) orderNode.value = "";
  }

  function submitTicket(content, type, options) {
    var config = options || {};
    if (!app || !app.post) {
      showMessage("客服接口未初始化");
      return Promise.reject(new Error("客服接口未初始化"));
    }
    setSubmitLoading(true);
    return app.post("/support-tickets", {
      type: type || "OTHER",
      orderId: orderNode ? orderNode.value : "",
      content: content,
      contact: contactNode ? contactNode.value.trim() : ""
    }).then(function () {
      showMessage(config.successMessage || "已转人工，等待员工回复");
      if (config.botReply) appendBotReply(config.botReply, false);
      resetHumanForm();
      return loadPage();
    }).catch(function (error) {
      showMessage(error.message || "提交失败");
    }).finally(function () {
      setSubmitLoading(false);
    });
  }

  function transferHuman() {
    var typedContent = contentNode ? contentNode.value.trim() : "";
    var finalContent = typedContent || lastQuestionContent || "我要转人工，请客服人员联系我。";
    var finalType = typedContent ? classifyQuestion(typedContent) : lastQuestionType;
    if (typedContent) {
      appendUserMessage(typedContent, "未读");
      lastQuestionContent = typedContent;
      lastQuestionType = finalType;
      if (contentNode) contentNode.value = "";
    }
    return submitTicket("【转人工】" + finalContent, finalType, {
      successMessage: "已转人工，等待员工回复",
      botReply: "已转人工，员工会在后台看到你的问题。稍后点击刷新，可以查看员工回复。"
    });
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var content = contentNode ? contentNode.value.trim() : "";
      if (!content) {
        showMessage("请先输入问题");
        return;
      }
      if (/转人工|人工|员工/.test(content) && lastQuestionContent) {
        appendUserMessage(content, "已读");
        if (contentNode) contentNode.value = "";
        transferHuman();
        return;
      }
      askRobot(content);
      if (contentNode) contentNode.value = "";
    });
  }

  if (refreshNode) {
    refreshNode.addEventListener("click", loadPage);
  }

  if (composerToggle && composerTools) {
    composerToggle.addEventListener("click", function () {
      var nextHidden = !composerTools.hidden;
      composerTools.hidden = nextHidden;
      composerToggle.classList.toggle("is-open", !nextHidden);
      composerToggle.textContent = nextHidden ? "+" : "×";
    });
  }

  if (botThread) {
    botThread.addEventListener("click", function (event) {
      var transferButton = event.target.closest("[data-transfer-human]");
      if (transferButton) {
        transferHuman();
        return;
      }
      var quickButton = event.target.closest("[data-bot-quick]");
      if (!quickButton) return;
      var preset = BOT_QUICK[quickButton.dataset.botQuick];
      if (!preset) return;
      askRobot(preset.message, preset.type);
    });
  }

  if (!app || !app.get || !app.post) {
    setLoading(false);
    renderTickets([]);
    appendBotReply("当前客服接口没有初始化，请先确认后端服务是否启动。", false);
    return;
  }

  ensureLogin()
    .then(loadPage)
    .catch(function (error) {
      setLoading(false);
      renderTickets([]);
      showMessage(error.message || "请先登录");
    });
});
