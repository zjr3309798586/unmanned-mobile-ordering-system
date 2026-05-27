/**
 * "我的"页交互。
 *
 * 主要职责:
 *   1. 顶部 hero 区:显示昵称和登录提示文案(未登录 → "点这里登录";已登录 → "点这里退出")
 *   2. 资产数字:券数 / 积分 / 余额,来自 /api/mine
 *   3. 订单待取餐徽章:统计 /api/orders 里 WAITING_PICKUP 的数量
 *   4. 登录入口:点 hero 区 → 弹 prompt 输入昵称做 devLogin;已登录则 confirm 退出
 *
 * 优化点:页面加载时立即用 localStorage 里的 session 同步 hero title,
 * 避免显示"登录/注册"导致已登录用户误以为没登录的视觉闪动。
 */
document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;

  // 抓 DOM 节点(用 data-* 属性查找,而不是依赖 class,避免 class 改了找不到)
  var heroTitle = document.querySelector(".hero-title");
  var heroSubtitle = document.querySelector(".hero-subtitle");
  var couponNum = document.querySelector('[data-asset="coupon"]');
  var pointsNum = document.querySelector('[data-asset="points"]');
  var balanceNum = document.querySelector('[data-asset="balance"]');
  var orderBadge = document.querySelector('[data-order-badge="pickup"]');

  /** 安全 setText:节点可能不存在,值可能是 null,都跳过避免报错。 */
  function setText(el, value) {
    if (el && value != null) {
      el.textContent = value;
    }
  }

  /** 已登录态:把 /api/mine 返回的资料填到页面上。 */
  function renderLoggedIn(user) {
    if (!user) return;
    setText(heroTitle, user.nickname || "微信用户");
    setText(heroSubtitle, "已登录 · 同步订单与会员权益");
    setText(couponNum, user.couponCount != null ? user.couponCount : 0);
    setText(pointsNum, user.points != null ? user.points : 0);
    // 余额需要格式化成 "¥ X.XX",用 app.money;app 没加载时跳过
    if (balanceNum && app && app.money) {
      balanceNum.textContent = app.money(user.balance);
    }
  }

  /**
   * 计算"待取餐"订单数,显示在订单图标右上角红点上。
   * 没有待取餐 → 隐藏徽章。
   */
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

  // ===== 全局点击事件委托:登录/退出登录 =====
  // 用 document 监听比给具体按钮绑监听更稳:hero 区结构可能因登录态变化
  document.addEventListener("click", function (event) {
    var loginTrigger = event.target.closest("[data-dev-login]");
    var logoutTrigger = event.target.closest("[data-logout]");
    if (loginTrigger) {
      event.preventDefault();
      // 已登录:再次点击当作"退出意图",二次确认后退出
      if (app.isLoggedIn && app.isLoggedIn()) {
        if (!window.confirm("已登录,是否退出?")) return;
        app.logout().then(function () {
          app.showMessage("已退出登录");
          window.setTimeout(function () { window.location.reload(); }, 400);
        });
        return;
      }
      // 未登录:弹 prompt 让用户输入昵称(开发模式,正式应该走微信登录)
      var nickname = window.prompt("输入一个昵称登录(开发模式)", "小豹用户" + Math.floor(Math.random()*9000+1000));
      if (!nickname) return;
      app.devLogin(nickname.trim())
        .then(function () {
          app.showMessage("欢迎,"+nickname);
          window.setTimeout(function () { window.location.reload(); }, 400);
        })
        .catch(function (error) { app.showMessage(error.message); });
    }
    // 单独的"退出"按钮(如有)
    if (logoutTrigger) {
      event.preventDefault();
      app.logout().then(function () {
        app.showMessage("已退出登录");
        window.setTimeout(function () { window.location.reload(); }, 400);
      });
    }
  });

  // ===== 立即同步 hero 文案(关键:避免视觉闪动)=====
  // 不等接口回来就先用 localStorage 里的 session 填,接口数据回来后再覆盖更准确的值
  if (app && app.isLoggedIn && app.isLoggedIn()) {
    var sess = app.getUserSession ? app.getUserSession() : null;
    if (sess && sess.nickname) {
      setText(heroTitle, sess.nickname);
      setText(heroSubtitle, "已登录 · 点这里退出");
    }
  } else {
    setText(heroSubtitle, "点这里登录,解锁更多权益");
  }

  // 未登录就到此为止,不发请求(防止后端 401 报错)
  if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
    return;
  }

  // 并行拉用户资料 + 订单列表
  // 用 Promise.all 一次性等两个接口,而不是串行,加载快
  Promise.all([app.get("/mine"), app.get("/orders")])
    .then(function (result) {
      renderLoggedIn(result[0]);
      renderOrderBadge(result[1]);
    })
    .catch(function (error) {
      if (app && app.showMessage) app.showMessage(error.message);
    });
});
