document.addEventListener("DOMContentLoaded", function () {
  var inner = document.querySelector("[data-carousel-inner]");
  var indicators = document.querySelectorAll("[data-carousel-indicators] .c-dot");
  if (!inner) return;

  var idx = 0;
  var total = 3;
  var timer = null;

  function update() {
    inner.style.transform = "translateX(-" + (idx * 100) + "%)";
    indicators.forEach(function (d, i) {
      d.classList.toggle("is-active", i === idx);
    });
  }

  function next() {
    idx = (idx + 1) % total;
    update();
  }

  function startAuto() {
    stopAuto();
    timer = setInterval(next, 5000);
  }
  function stopAuto() { if (timer) clearInterval(timer); timer = null; }

  startAuto();

  /* 触摸滑动 */
  var startX = 0;
  inner.addEventListener("touchstart", function (e) {
    stopAuto();
    startX = e.touches[0].clientX;
  }, { passive: true });

  inner.addEventListener("touchend", function (e) {
    var endX = e.changedTouches[0].clientX;
    var diff = startX - endX;
    if (Math.abs(diff) > 50) {
      idx = diff > 0 ? (idx + 1) % total : (idx - 1 + total) % total;
      update();
    }
    startAuto();
  }, { passive: true });

  /* 点击指示器 */
  indicators.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      idx = i;
      update();
      startAuto();
    });
  });

  /* 自取/外卖按钮 */
  document.querySelectorAll("[data-mode]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var mode = btn.dataset.mode;
      try { sessionStorage.setItem("orderMode", mode); } catch (e) {}
      window.location.href = "menu.html";
    });
  });
});
