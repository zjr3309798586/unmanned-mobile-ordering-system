document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;

  var heroTitle = document.querySelector(".hero-title");
  var heroSubtitle = document.querySelector(".hero-subtitle");
  var couponNum = document.querySelector('[data-asset="coupon"]');
  var pointsNum = document.querySelector('[data-asset="points"]');
  var balanceNum = document.querySelector('[data-asset="balance"]');
  var orderBadge = document.querySelector('[data-order-badge="pickup"]');

  function setText(el, value) {
    if (el && value != null) {
      el.textContent = value;
    }
  }

  function renderLoggedIn(user) {
    if (!user) return;
    setText(heroTitle, user.nickname || "微信用户");
    setText(heroSubtitle, "已登录 · 同步订单与会员权益");
    setText(couponNum, user.couponCount != null ? user.couponCount : 0);
    setText(pointsNum, user.points != null ? user.points : 0);
    if (balanceNum && app && app.money) {
      balanceNum.textContent = app.money(user.balance);
    }
  }

  function renderOrderBadge(orders) {
    if (!orderBadge) return;
    var list = orders || [];
    var waiting = list.filter(function (o) {
      return o.status === "WAITING_PICKUP";
    }).length;
    if (waiting > 0) {
      orderBadge.textContent = waiting;
      orderBadge.style.display = "";
    } else {
      orderBadge.style.display = "none";
    }
  }

  document.addEventListener("click", function (event) {
    var loginTrigger = event.target.closest("[data-dev-login]");
    var logoutTrigger = event.target.closest("[data-logout]");
    if (loginTrigger) {
      event.preventDefault();
      if (app.isLoggedIn && app.isLoggedIn()) {
        if (!window.confirm("已登录,是否退出?")) return;
        app.logout().then(function () {
          app.showMessage("已退出登录");
          window.setTimeout(function () { window.location.reload(); }, 400);
        });
        return;
      }
      var nickname = window.prompt("输入一个昵称登录(开发模式)", "小豹用户" + Math.floor(Math.random()*9000+1000));
      if (!nickname) return;
      app.devLogin(nickname.trim())
        .then(function () {
          app.showMessage("欢迎,"+nickname);
          window.setTimeout(function () { window.location.reload(); }, 400);
        })
        .catch(function (error) { app.showMessage(error.message); });
    }
    if (logoutTrigger) {
      event.preventDefault();
      app.logout().then(function () {
        app.showMessage("已退出登录");
        window.setTimeout(function () { window.location.reload(); }, 400);
      });
    }
  });

  // 立即用 localStorage 里的 session 同步 hero title,避免显示"登录/注册"误导
  if (app && app.isLoggedIn && app.isLoggedIn()) {
    var sess = app.getUserSession ? app.getUserSession() : null;
    if (sess && sess.nickname) {
      setText(heroTitle, sess.nickname);
      setText(heroSubtitle, "已登录 · 点这里退出");
    }
  } else {
    setText(heroSubtitle, "点这里登录,解锁更多权益");
  }

  if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
    return;
  }

  Promise.all([app.get("/mine"), app.get("/orders")])
    .then(function (result) {
      renderLoggedIn(result[0]);
      renderOrderBadge(result[1]);
    })
    .catch(function (error) {
      if (app && app.showMessage) app.showMessage(error.message);
    });
});
