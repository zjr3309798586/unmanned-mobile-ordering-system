/**
 * 首页交互。
 *
 * 两块功能:
 *   1. 顶部 3 张 Banner 自动轮播(5 秒切换 + 触摸滑动 + 点击指示器)
 *   2. "自取/外卖"按钮:记录用户选择到 sessionStorage,跳点餐页
 */
document.addEventListener("DOMContentLoaded", function () {
  var inner = document.querySelector("[data-carousel-inner]");
  var indicators = document.querySelectorAll("[data-carousel-indicators] .c-dot");
  if (!inner) return;  // 没有轮播组件就退出,防止页面没加载完时报错

  var idx = 0;          // 当前显示的 banner 索引(0/1/2)
  var total = 3;        // banner 总数
  var timer = null;     // 自动轮播 setInterval 句柄

  /** 切换到 idx 对应的 banner,同时同步指示器高亮。 */
  function update() {
    // 用 translateX(-N%) 移动 inner 容器实现切换,inner 是 width:300% 的横向布局
    inner.style.transform = "translateX(-" + (idx * 100) + "%)";
    indicators.forEach(function (d, i) {
      d.classList.toggle("is-active", i === idx);
    });
  }

  /** 切到下一张(轮播 / 滑动 都用)。 */
  function next() {
    idx = (idx + 1) % total;   // 末尾自动回到 0
    update();
  }

  /** 启动 5 秒自动轮播。每次启动前先清旧 timer,避免重叠多个 timer。 */
  function startAuto() {
    stopAuto();
    timer = setInterval(next, 5000);
  }
  function stopAuto() { if (timer) clearInterval(timer); timer = null; }

  startAuto();

  // ===== 触摸滑动 =====
  // 用户碰到屏幕时记录起点;松手时计算横向位移,> 50px 算"有效滑动"。
  var startX = 0;
  inner.addEventListener("touchstart", function (e) {
    stopAuto();   // 用户开始操作就停自动轮播,松手再恢复
    startX = e.touches[0].clientX;
  }, { passive: true });

  inner.addEventListener("touchend", function (e) {
    var endX = e.changedTouches[0].clientX;
    var diff = startX - endX;
    if (Math.abs(diff) > 50) {
      // diff > 0 → 用户向左滑(看下一张);< 0 → 向右滑(看上一张)
      idx = diff > 0 ? (idx + 1) % total : (idx - 1 + total) % total;
      update();
    }
    startAuto();   // 操作结束后恢复自动轮播
  }, { passive: true });

  // ===== 点击指示器小圆点直接跳到对应 banner =====
  indicators.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      idx = i;
      update();
      startAuto();   // 重置 5 秒计时
    });
  });

  // ===== 自取 / 外卖模式按钮 =====
  // 用户选了模式后存到 sessionStorage(标签页关闭即清),点餐页会读取这个 mode 决定显示逻辑
  document.querySelectorAll("[data-mode]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var mode = btn.dataset.mode;
      try { sessionStorage.setItem("orderMode", mode); } catch (e) {}
      window.location.href = "menu.html";
    });
  });
});
