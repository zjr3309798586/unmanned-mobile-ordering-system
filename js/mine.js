document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var profileTitle = document.querySelector(".profile-title");
  var profileText = document.querySelector(".profile-text");
  var memberTitle = document.querySelector(".member-title");
  var memberText = document.querySelector(".member-entry .info-text");
  var assetGrid = document.querySelector(".asset-grid");
  var serviceList = document.querySelector(".service-list");
  var actionRow = document.querySelector(".profile-copy .action-row");

  function renderLoggedOut() {
    if (profileTitle) {
      profileTitle.textContent = "请先登录";
    }
    if (profileText) {
      profileText.textContent = "登录后可以同步订单、购物车、优惠券和会员权益。";
    }
    if (actionRow) {
      actionRow.innerHTML = '<button class="button button-primary" type="button" data-dev-login>一键登录</button>';
    }
    if (memberTitle) {
      memberTitle.textContent = "未登录";
    }
    if (memberText) {
      memberText.textContent = "登录后才会显示会员等级、积分、余额和优惠券。";
    }
    if (assetGrid) {
      assetGrid.innerHTML = '<div class="asset-card"><strong>--</strong><span>优惠券</span></div>' +
        '<div class="asset-card"><strong>--</strong><span>积分</span></div>' +
        '<div class="asset-card"><strong>--</strong><span>余额</span></div>';
    }
    if (serviceList) {
      serviceList.innerHTML = '<a class="service-row" href="mine.html" data-dev-login>' +
        '<div><strong class="info-title">登录后查看订单</strong><p class="info-text">订单、购物车和资产会绑定到你的账号。</p></div><span class="row-arrow">›</span>' +
      '</a>';
    }
  }

  function renderMine(user) {
    if (!user) {
      return;
    }
    if (profileTitle) {
      profileTitle.textContent = user.nickname || "微信用户";
    }
    if (profileText) {
      profileText.textContent = "订单、优惠券、会员权益和余额会随账户数据更新。";
    }
    if (actionRow) {
      actionRow.innerHTML = '<button class="button button-secondary" type="button" data-logout>退出登录</button>';
    }
    if (memberTitle) {
      memberTitle.textContent = user.memberLevel || "普通会员";
    }
    if (memberText) {
      memberText.textContent = "成长积分 " + (user.points || 0) + "，预计本月已节省 " + app.money(user.savingAmount) + "。";
    }
    if (assetGrid) {
      assetGrid.innerHTML = '<div class="asset-card"><strong>' + (user.couponCount || 0) + '</strong><span>优惠券</span></div>' +
        '<div class="asset-card"><strong>' + (user.points || 0) + '</strong><span>积分</span></div>' +
        '<div class="asset-card"><strong>' + app.money(user.balance) + '</strong><span>余额</span></div>';
    }
  }

  function renderOrderLinks(orders) {
    if (!serviceList) {
      return;
    }
    var list = orders || [];
    var waiting = list.filter(function (order) {
      return order.status === "WAITING_PICKUP";
    }).length;
    var history = list.length - waiting;
    serviceList.innerHTML = '<a class="service-row" href="order.html" data-service-link>' +
      '<div><strong class="info-title">待出餐订单</strong><p class="info-text">当前有 ' + waiting + ' 个进行中订单，可查看取餐号和下单时间。</p></div><span class="row-arrow">›</span>' +
    '</a>' +
    '<a class="service-row" href="order.html" data-service-link>' +
      '<div><strong class="info-title">历史订单</strong><p class="info-text">已有 ' + history + ' 个历史订单，支持再来一单。</p></div><span class="row-arrow">›</span>' +
    '</a>';
  }

  document.querySelectorAll("[data-service-link]").forEach(function (link) {
    link.addEventListener("click", function () {
      document.querySelectorAll("[data-service-link]").forEach(function (item) {
        item.classList.remove("is-highlight");
      });
      link.classList.add("is-highlight");
    });
  });

  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-dev-login]")) {
      event.preventDefault();
      app.devLogin("游客用户")
        .then(function () {
          app.showMessage("登录成功");
          window.setTimeout(function () {
            window.location.reload();
          }, 400);
        })
        .catch(function (error) {
          app.showMessage(error.message);
        });
    }
    if (event.target.closest("[data-logout]")) {
      event.preventDefault();
      app.logout().then(function () {
        app.showMessage("已退出登录");
        window.setTimeout(function () {
          window.location.reload();
        }, 400);
      });
    }
  });

  if (!app.isLoggedIn()) {
    renderLoggedOut();
    return;
  }

  Promise.all([app.get("/mine"), app.get("/orders")])
    .then(function (result) {
      renderMine(result[0]);
      renderOrderLinks(result[1]);
    })
    .catch(function (error) {
      app.showMessage(error.message);
    });
});
