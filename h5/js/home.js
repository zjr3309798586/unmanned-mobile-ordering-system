document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp || {};
  var inner = document.querySelector("[data-carousel-inner]");
  if (!inner) return;  // 没有轮播组件就退出,防止页面没加载完时报错

  var indicatorBox = document.querySelector("[data-carousel-indicators]");
  var indicators = indicatorBox ? indicatorBox.querySelectorAll(".c-dot") : [];
  var fallbackSlidesHtml = inner.innerHTML;
  var idx = 0;
  var total = Math.max(1, inner.querySelectorAll(".c-slide").length || 3);
  var timer = null;

  function escapeHtml(value) {
    return app.escapeHtml ? app.escapeHtml(value) : String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function localImage(value) {
    return app.imageUrl ? app.imageUrl(value) : value;
  }

  function normalizeLink(value) {
    if (!value) return "/menu.html";
    if (/^https?:\/\//.test(value) || value.indexOf("/") === 0) return value;
    return "/" + value;
  }

  function update() {
    inner.style.transform = "translateX(-" + (idx * 100) + "%)";
    indicators.forEach(function (d, i) {
      d.classList.toggle("is-active", i === idx);
    });
  }

  function next() {
    idx = (idx + 1) % total;   // 末尾自动回到 0
    update();
  }

  function startAuto() {
    stopAuto();
    if (total <= 1) return;
    timer = setInterval(next, 5000);
  }
  function stopAuto() { if (timer) clearInterval(timer); timer = null; }

  function renderSlides(banners) {
    var list = (banners || []).filter(function (item) { return item && item.image; }).slice(0, 5);
    if (!list.length) return;

    var remoteSlidesHtml = list.map(function (banner) {
      var image = escapeHtml(localImage(banner.image));
      var title = escapeHtml(banner.title || "");
      var subtitle = escapeHtml(banner.subtitle || "");
      var link = escapeHtml(normalizeLink(banner.linkUrl || "/menu.html"));
      return '<article class="c-slide" data-link="' + link + '">'
        + '<div class="c-bg" style="background-image:url(&quot;' + image + '&quot;)"></div>'
        + ((title || subtitle)
          ? '<div class="c-banner-caption">'
              + (title ? '<strong>' + title + '</strong>' : '')
              + (subtitle ? '<span>' + subtitle + '</span>' : '')
            + '</div>'
          : '')
        + '</article>';
    }).join("");

    // Keep the approved local hero images, and append backend-managed banners.
    inner.innerHTML = fallbackSlidesHtml + remoteSlidesHtml;
    total = inner.querySelectorAll(".c-slide").length;
    idx = 0;
    if (indicatorBox) {
      indicatorBox.innerHTML = Array.from({ length: total }).map(function (_, i) {
        return '<span class="c-dot' + (i === 0 ? ' is-active' : '') + '"></span>';
      }).join("");
      indicators = indicatorBox.querySelectorAll(".c-dot");
      bindIndicators();
    }
    update();
    startAuto();
  }

  function bindIndicators() {
    indicators.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        idx = i;
        update();
        startAuto();
      });
    });
  }

  function renderStore(store) {
    if (!store) return;
    var name = document.querySelector("[data-store-name]");
    var distance = document.querySelector("[data-store-distance]");
    var status = document.querySelector("[data-store-status]");
    var notice = document.querySelector("[data-store-notice]");
    if (name) name.textContent = store.name || "云豹小点·校园店";
    if (distance) distance.textContent = "距离 " + (store.distance || "520m");
    if (status) status.textContent = "营业中";
    if (notice) notice.textContent = store.notice || ("营业时间 " + (store.businessHours || "08:00 - 22:30"));
  }

  function renderProducts(products) {
    var box = document.querySelector("[data-home-products]");
    if (!box) return;
    var list = (products || []).slice(0, 6);
    if (!list.length) return;
    box.innerHTML = list.map(function (p) {
      var image = localImage(p.image || "/images/common/food-placeholder.svg");
      var price = Number(p.price || 0).toFixed(1);
      return '<a class="home-product-card" href="/detail.html?id=' + encodeURIComponent(p.id) + '">'
        + '<img src="' + image + '" alt="' + escapeHtml(p.name) + '" onerror="this.src=\'/images/common/food-placeholder.svg\'">'
        + '<strong>' + escapeHtml(p.name) + '</strong>'
        + '<span>' + escapeHtml(p.description || "清爽好喝,轻松点单") + '</span>'
        + '<em>¥' + price + '</em>'
        + '</a>';
    }).join("");
  }

  if (app.get) {
    app.get("/store").then(renderStore).catch(function () {});
    app.get("/banners").then(renderSlides).catch(function () {});
    app.get("/products").then(renderProducts).catch(function () {});
  }

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

  inner.addEventListener("click", function (event) {
    var slide = event.target.closest("[data-link]");
    if (slide && slide.dataset.link) {
      window.location.href = slide.dataset.link;
    }
  });

  bindIndicators();
  startAuto();

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
