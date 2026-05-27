/**
 * 购物车 / 结算页(cart.html)交互。
 *
 * 这是项目最核心的页面 —— 用户在这里看到最终的金额并下单。
 *
 * 业务流程:
 *   1. 进入页面 → 拉 /cart 和 /user/coupons → 渲染商品列表 + 自动选最优可用券
 *   2. 用户可以点"优惠券"卡片打开抽屉,自主选/换券,也可以"不使用优惠券"
 *   3. 点"立即支付" → 调 /orders 创建订单 → 跳订单页
 *
 * 关键设计:
 *   - 不接受前端传商品/价格,后端从购物车实时读
 *   - 不可用券也展示在抽屉里(让用户"凑单"),但置灰 + 点击只弹"还差 ¥X"
 *   - 下单时即使 selectedCoupon 已选,也要 total >= conditionAmount 才发 couponId
 *     (双重校验,与后端的乐观锁形成防御纵深)
 */
document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;

  // ===== DOM 引用 =====
  var payBtn = document.querySelector("[data-pay]");
  var totalQtyNode = document.querySelector("[data-total-qty]");
  var totalAmtNode = document.querySelector("[data-total-amount]");
  var payIntNode = document.querySelector("[data-pay-int]");
  var payDecNode = document.querySelector("[data-pay-dec]");
  var payOriginNode = document.querySelector("[data-pay-origin]");
  var savedNode = document.querySelector("[data-saved]");
  var itemsBox = document.querySelector("[data-cart-items]");
  var emptyCard = document.querySelector("[data-cart-empty]");
  var cartCard = document.querySelector("[data-cart-card]");
  var drNameNode = document.querySelector("[data-dr-name]");
  var drAmtNode = document.querySelector("[data-dr-amount]");
  var drHintNode = document.querySelector("[data-dr-hint]");
  var couponEntry = document.querySelector("[data-coupon-entry]");
  var couponMask = document.querySelector("[data-coupon-mask]");
  var couponDrawer = document.querySelector("[data-coupon-drawer]");
  var couponList = document.querySelector("[data-coupon-list]");
  var couponClose = document.querySelector("[data-coupon-close]");
  var couponClear = document.querySelector("[data-coupon-clear]");

  // ===== 状态 =====
  var cart = { items: [], totalAmount: 0, totalQuantity: 0 };
  var myCoupons = [];           // 已领可用券(过滤 status=AVAILABLE 后的列表)
  var selectedCoupon = null;    // {id, title, conditionAmount, discountAmount}

  // ===== 渲染购物车 =====

  /**
   * 渲染商品列表 + 空购物车占位的切换。
   * 0 件 → 隐藏 cartCard,显示 emptyCard(去点餐链接)
   * 有件 → 反过来,并渲染每项明细
   */
  function renderCart() {
    var items = cart.items || [];
    if (items.length === 0) {
      if (cartCard) cartCard.style.display = "none";
      if (emptyCard) emptyCard.style.display = "";
      if (totalQtyNode) totalQtyNode.textContent = 0;
      if (totalAmtNode) totalAmtNode.textContent = 0;
      recalc();
      return;
    }
    if (cartCard) cartCard.style.display = "";
    if (emptyCard) emptyCard.style.display = "none";
    if (itemsBox) {
      itemsBox.innerHTML = items.map(function (it) {
        // 单项小计:后端返回的 subtotal 优先;没有就 price × quantity 兜底
        var sub = Number(it.subtotal != null ? it.subtotal : Number(it.price) * Number(it.quantity)) || 0;
        var img = it.image ? (app.imageUrl ? app.imageUrl(it.image) : it.image) : "/images/menu/menu-product-milk-tea.png";
        return '<article class="cart-item" data-default-item data-id="' + escapeHtml(it.id) + '" data-price="' + Number(it.price || 0) + '" data-qty="' + Number(it.quantity || 1) + '">'
          + '<div class="ci-thumb"><img src="' + img + '" onerror="this.src=\'images/common/food-placeholder.svg\'"></div>'
          + '<div class="ci-body">'
          +   '<div class="ci-row1"><h4 class="ci-name">' + escapeHtml(it.productName || it.name || "商品") + '</h4>'
          +     '<div class="ci-price"><span class="ci-yuan">¥</span><span class="ci-int">' + sub.toFixed(1) + '</span></div></div>'
          +   '<p class="ci-spec">' + escapeHtml(it.specText || (typeof it.spec === "string" ? it.spec : "标准杯")) + '</p>'
          +   '<div class="ci-row3"><span></span><span class="ci-qty">x' + it.quantity + '</span></div>'
          + '</div>'
        + '</article>';
      }).join("");
    }
    recalc();
  }

  /** XSS 转义兜底(app 没加载也能工作)。 */
  function escapeHtml(v) { return app && app.escapeHtml ? app.escapeHtml(v == null ? "" : v) : String(v || ""); }

  // ===== 重算金额 + 优惠 =====

  /**
   * 重新计算并刷新所有金额展示。
   * 触发时机:商品列表变化、用户选了/换了券、清空券。
   *
   * 算法:
   *   total = 后端 totalAmount 优先,否则前端 price × quantity 累加
   *   saved = selectedCoupon 存在且 total >= 门槛时,取 discountAmount,否则 0
   *   pay = max(total - saved, 0)   // 防券面额超过总价时变负
   */
  function recalc() {
    var total = Number(cart.totalAmount || 0);
    if (!total && cart.items) {
      total = cart.items.reduce(function (s, it) { return s + Number(it.price || 0) * Number(it.quantity || 1); }, 0);
    }
    var qty = Number(cart.totalQuantity || 0);
    if (!qty && cart.items) {
      qty = cart.items.reduce(function (s, it) { return s + Number(it.quantity || 1); }, 0);
    }
    var saved = 0;
    // ★ 双重校验:就算 selectedCoupon 不为 null,也要 total >= 门槛才生效
    // 这是为了用户改了购物车数量后,如果金额降到门槛以下,自动取消优惠
    if (selectedCoupon && total >= Number(selectedCoupon.conditionAmount || 0)) {
      saved = Number(selectedCoupon.discountAmount || 0);
    }
    var pay = Math.max(total - saved, 0);
    var pi = pay.toFixed(1).split(".");
    if (totalQtyNode) totalQtyNode.textContent = qty;
    if (totalAmtNode) totalAmtNode.textContent = total.toFixed(1);
    if (payIntNode) payIntNode.textContent = pi[0];
    if (payDecNode) payDecNode.textContent = "." + (pi[1] || "0");
    if (payOriginNode) payOriginNode.textContent = "¥" + total.toFixed(1);
    if (savedNode) savedNode.textContent = "¥" + saved.toFixed(1);

    // 同步"优惠券"卡片入口的展示文案
    if (selectedCoupon) {
      if (drNameNode) drNameNode.textContent = selectedCoupon.title;
      if (drAmtNode) drAmtNode.textContent = "-¥" + saved.toFixed(1);
      // 已选了但金额掉到门槛以下时,提示"未满"
      if (drHintNode) drHintNode.textContent = saved > 0 ? "已使用" : ("满 ¥" + Number(selectedCoupon.conditionAmount || 0).toFixed(0) + " 可用,当前未满");
    } else {
      // 没选券:有可用券 → 提示去选;没券 → 提示去领
      if (drNameNode) drNameNode.textContent = myCoupons.length > 0 ? "未选择优惠券" : "暂无可用优惠券";
      if (drAmtNode) drAmtNode.textContent = "-¥0.0";
      if (drHintNode) drHintNode.textContent = myCoupons.length > 0 ? "点击右上角选择券" : "去省钱卡领券更优惠";
    }
  }

  // ===== 加载数据 =====

  /**
   * 初始化数据加载。
   * 未登录就直接渲染空状态;登录后并行拉购物车和券,合并处理。
   * 自动选最优券规则:在满门槛的券中,选 discountAmount 最大的。
   */
  function loadAll() {
    if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
      cart = { items: [], totalAmount: 0, totalQuantity: 0 };
      myCoupons = [];
      renderCart();
      return;
    }
    Promise.all([
      app.get("/cart").catch(function () { return null; }),
      app.get("/user/coupons").catch(function () { return []; })
    ]).then(function (res) {
      cart = res[0] || { items: [], totalAmount: 0, totalQuantity: 0 };
      var coupons = res[1] || [];
      // 只取已领待用且 status=AVAILABLE 的;空 status 也算可用(兼容旧数据)
      myCoupons = coupons.filter(function (c) {
        return (c.status === "AVAILABLE" || !c.status);
      }).map(function (c) {
        // 标准化字段名:后端可能返回 couponId 或 id,统一成 id
        return {
          id: c.couponId || c.id,
          title: c.title || "优惠券",
          conditionAmount: Number(c.conditionAmount || 0),
          discountAmount: Number(c.discountAmount || 0),
          conditionText: c.conditionText || ("满 " + (c.conditionAmount || 0) + " 减 " + (c.discountAmount || 0))
        };
      });
      // 自动选最优券(满门槛 & 减最多)
      var total = Number(cart.totalAmount || 0);
      var usable = myCoupons.filter(function (c) { return total >= c.conditionAmount; });
      if (usable.length > 0) {
        usable.sort(function (a, b) { return b.discountAmount - a.discountAmount; });
        selectedCoupon = usable[0];
      } else {
        selectedCoupon = null;
      }
      renderCart();
    });
  }

  // ===== 优惠券抽屉 =====

  function openDrawer() {
    if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
      if (app && app.showMessage) app.showMessage("请先登录");
      return;
    }
    renderCouponList();
    if (couponDrawer) couponDrawer.classList.add("is-open");
    if (couponMask) couponMask.classList.add("is-open");
  }
  function closeDrawer() {
    if (couponDrawer) couponDrawer.classList.remove("is-open");
    if (couponMask) couponMask.classList.remove("is-open");
  }

  /**
   * 渲染优惠券列表。★ 关键产品决策:
   *   - 可用券 + 不可用券都展示,不可用置灰(让用户能"凑单看目标券")
   *   - 已选中的券高亮(is-selected)
   *   - 不可用的券在条件文案后加 "还差 ¥X.X" 红色小标
   *   - 排序:可用排前,同状态内按 discount 降序
   */
  function renderCouponList() {
    if (!couponList) return;
    if (myCoupons.length === 0) {
      couponList.innerHTML = '<p class="cd-coupon-empty">还没有可用优惠券<br>去省钱卡领一张</p>';
      return;
    }
    var total = Number(cart.totalAmount || 0);
    var sorted = myCoupons.slice().sort(function (a, b) {
      var aOk = total >= a.conditionAmount ? 0 : 1;
      var bOk = total >= b.conditionAmount ? 0 : 1;
      if (aOk !== bOk) return aOk - bOk;          // 可用排前
      return b.discountAmount - a.discountAmount;  // 同状态内减得多的排前
    });
    couponList.innerHTML = sorted.map(function (c) {
      var usable = total >= c.conditionAmount;
      var isSel = selectedCoupon && selectedCoupon.id === c.id;
      var gap = usable ? 0 : (c.conditionAmount - total);
      var cls = "cd-coupon" + (isSel ? " is-selected" : "") + (usable ? "" : " is-disabled");
      var condHtml = escapeHtml(c.conditionText);
      if (!usable) {
        // 不可用券补充"还差 ¥X.X"提示,让用户知道差多少能解锁
        condHtml += ' <span class="cdc-gap">还差 ¥' + gap.toFixed(1) + '</span>';
      }
      // dataset 里既存 usable 也存 gap,点击事件直接读,不用再算
      return '<div class="' + cls + '" data-coupon-pick="' + escapeHtml(c.id) + '" data-coupon-usable="' + (usable ? "1" : "0") + '" data-coupon-gap="' + gap.toFixed(1) + '">'
        + '<div class="cdc-amount"><span class="cdc-yuan">¥</span><span class="cdc-int">' + c.discountAmount + '</span></div>'
        + '<div class="cdc-body"><div class="cdc-title">' + escapeHtml(c.title) + '</div><div class="cdc-cond">' + condHtml + '</div></div>'
      + '</div>';
    }).join("");
  }
  if (couponEntry) couponEntry.addEventListener("click", openDrawer);
  if (couponClose) couponClose.addEventListener("click", closeDrawer);
  if (couponMask) couponMask.addEventListener("click", closeDrawer);
  // "不使用优惠券"按钮:清空选择 + 重算 + 关抽屉
  if (couponClear) couponClear.addEventListener("click", function () { selectedCoupon = null; recalc(); closeDrawer(); });

  // 选券事件(委托到抽屉容器)
  if (couponList) couponList.addEventListener("click", function (e) {
    var item = e.target.closest("[data-coupon-pick]");
    if (!item) return;
    // 不可用券:只弹提示,不选中
    if (item.classList.contains("is-disabled")) {
      var gap = item.dataset.couponGap || "0.0";
      if (app && app.showMessage) app.showMessage("还差 ¥" + gap + " 可用");
      return;
    }
    var id = item.dataset.couponPick;
    selectedCoupon = myCoupons.find(function (c) { return String(c.id) === String(id); }) || null;
    recalc();
    closeDrawer();
  });

  // ===== 下单 =====

  if (payBtn) {
    payBtn.addEventListener("click", function () {
      // 未登录 → 引导去登录页
      if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
        if (app && app.showMessage) app.showMessage("请先登录后支付");
        window.setTimeout(function () { window.location.href = "mine.html"; }, 500);
        return;
      }
      // 空购物车不下单
      if (!cart.items || cart.items.length === 0) {
        if (app && app.showMessage) app.showMessage("购物车为空");
        return;
      }
      // 防止多次点击造成重复订单
      payBtn.disabled = true;
      payBtn.textContent = "支付中...";
      // 请求体:商品列表后端会自己读 cart_items,这里只传元数据
      var body = { source: "cart", pickupType: "PICKUP" };
      // ★ 双重校验:即便 selectedCoupon 有值,也要金额满门槛才发 couponId
      // 防止用户改了购物车后,前端忘记清空 selectedCoupon 导致后端拒单
      if (selectedCoupon && selectedCoupon.id) {
        var total = Number(cart.totalAmount || 0);
        if (total >= selectedCoupon.conditionAmount) body.couponId = selectedCoupon.id;
      }
      app.post("/orders", body)
        .then(function () {
          if (app.showMessage) app.showMessage("下单成功");
          // 500ms 后跳订单页(让用户看到成功 toast)
          window.setTimeout(function () { window.location.href = "order.html"; }, 500);
        })
        .catch(function (e) {
          // 失败:恢复按钮,让用户能重试
          if (app.showMessage) app.showMessage(e.message);
          payBtn.disabled = false;
          payBtn.textContent = "立即支付";
        });
    });
  }

  loadAll();   // 入口:加载数据并启动整个页面
});
