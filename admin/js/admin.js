(function () {
  var state = {
    categories: [],
    products: [],
    orders: [],
    coupons: []
  };

  var defaultApiBaseUrl = window.location.protocol === "file:"
    ? "http://127.0.0.1:8080/api"
    : window.location.origin + "/api";
  var apiBaseUrl = localStorage.getItem("orderingApiBaseUrl") || defaultApiBaseUrl;

  function adminToken() {
    return localStorage.getItem("umo-admin-token") || "";
  }

  function setAdminSession(session) {
    localStorage.setItem("umo-admin-token", session.token);
    localStorage.setItem("umo-admin-username", session.username);
  }

  function clearAdminSession() {
    localStorage.removeItem("umo-admin-token");
    localStorage.removeItem("umo-admin-username");
    localStorage.removeItem("umo-admin-login");
  }

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function request(path, options) {
    var config = options || {};
    config.headers = Object.assign({ "Content-Type": "application/json" }, config.headers || {});
    if (path.indexOf("/admin") === 0 && path !== "/admin/login") {
      config.headers["X-Admin-Token"] = adminToken();
    }
    if (config.body && typeof config.body !== "string") {
      config.body = JSON.stringify(config.body);
    }
    return fetch(apiBaseUrl + path, config)
      .then(function (response) {
        return response.json().then(function (payload) {
          if (!response.ok || payload.success === false) {
            if (response.status === 401 || payload.code === 401) {
              clearAdminSession();
              if (document.body.dataset.page !== "login") {
                window.location.href = "login.html";
              }
            }
            throw new Error(payload.message || "接口请求失败");
          }
          return payload.data;
        });
      });
  }

  function get(path) {
    return request(path);
  }

  function post(path, body) {
    return request(path, { method: "POST", body: body });
  }

  function patch(path, body) {
    return request(path, { method: "PATCH", body: body || {} });
  }

  function del(path) {
    return request(path, { method: "DELETE" });
  }

  function money(value) {
    return "¥ " + Number(value || 0).toFixed(2);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function statusText(status) {
    var map = {
      WAITING_PICKUP: "待取餐",
      COMPLETED: "已完成",
      CANCELED: "已取消"
    };
    return map[status] || status || "未知";
  }

  function statusClass(status) {
    if (status === "COMPLETED") {
      return "green";
    }
    if (status === "CANCELED") {
      return "red";
    }
    return "orange";
  }

  function statusFilter(status) {
    if (status === "COMPLETED") {
      return "done";
    }
    if (status === "CANCELED") {
      return "cancel";
    }
    return "waiting";
  }

  function pickupText(type) {
    var map = {
      SELF_PICKUP: "到店自取",
      DINE_IN: "堂食",
      DELIVERY: "平台外送"
    };
    return map[type] || type || "到店自取";
  }

  function categoryName(categoryId) {
    var category = state.categories.find(function (item) {
      return item.id === categoryId;
    });
    return category ? category.name : categoryId;
  }

  function showToast(message) {
    var toast = $(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message || "操作成功";
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 1800);
  }

  function showLoading(node, text) {
    if (node) {
      node.innerHTML = '<tr><td colspan="8" class="table-empty">' + escapeHtml(text || "正在读取后端数据...") + '</td></tr>';
    }
  }

  function initNav() {
    var page = document.body.getAttribute("data-page");
    if (!page) {
      return;
    }
    $all(".nav-item").forEach(function (item) {
      if (item.getAttribute("data-page") === page) {
        item.classList.add("active");
      }
    });
  }

  function initAuthGuard() {
    var page = document.body.dataset.page;
    if (page === "login") {
      if (adminToken()) {
        window.location.href = "dashboard.html";
        return false;
      }
      return true;
    }
    if (!adminToken()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

  function initLogin() {
    var form = $("#loginForm");
    if (!form) {
      return;
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var username = $("#username").value.trim();
      var password = $("#password").value;
      post("/admin/login", { username: username, password: password })
        .then(function (session) {
          setAdminSession(session);
          window.location.href = "dashboard.html";
        })
        .catch(function (error) {
          showToast(error.message);
        });
    });
  }

  function initSearch() {
    $all("[data-table-search]").forEach(function (input) {
      var table = $(input.getAttribute("data-table-search"));
      if (!table) {
        return;
      }
      input.addEventListener("input", function () {
        var keyword = input.value.trim().toLowerCase();
        $all("tbody tr", table).forEach(function (row) {
          row.style.display = row.textContent.toLowerCase().indexOf(keyword) >= 0 ? "" : "none";
        });
      });
    });
  }

  function initTabs() {
    $all("[data-status-filter]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var status = tab.getAttribute("data-status-filter");
        var target = $(tab.getAttribute("data-target"));
        $all(".tab", tab.parentElement).forEach(function (item) {
          item.classList.remove("active");
        });
        tab.classList.add("active");
        if (!target) {
          return;
        }
        $all("tbody tr", target).forEach(function (row) {
          row.style.display = status === "all" || row.getAttribute("data-status") === status ? "" : "none";
        });
      });
    });
  }

  function initButtons() {
    document.addEventListener("click", function (event) {
      var button = event.target.closest("[data-toast]");
      if (button) {
        showToast(button.getAttribute("data-toast"));
      }
    });

    var logout = $("#logoutBtn");
    if (logout) {
      logout.addEventListener("click", function () {
        clearAdminSession();
        window.location.href = "login.html";
      });
    }

    var menuToggle = $("#menuToggle");
    var sidebar = $("#sidebar");
    if (menuToggle && sidebar) {
      menuToggle.addEventListener("click", function () {
        sidebar.classList.toggle("open");
      });
    }
  }

  function initDate() {
    var date = $(".js-date");
    if (date) {
      date.textContent = new Date().toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
      });
    }
  }

  function initDashboardPage() {
    if (document.body.dataset.page !== "dashboard") {
      return;
    }
    Promise.all([get("/admin/dashboard"), get("/admin/products"), get("/admin/orders")])
      .then(function (result) {
        var dashboard = result[0];
        var products = result[1] || [];
        var orders = result[2] || [];
        var statCards = $all(".stat-card");
        setStatCard(statCards[0], "营业额", money(dashboard.orderAmount), "来自订单实付金额汇总");
        setStatCard(statCards[1], "订单总数", dashboard.orderCount, "前台提交订单后这里会增加");
        setStatCard(statCards[2], "在售菜品", dashboard.productCount, "菜品管理下架后会减少");
        setStatCard(statCards[3], "购物车商品", dashboard.cartItemCount, "前台加入购物车后会变化");
        renderHotProducts(products);
        renderTrend(orders);
      })
      .catch(function (error) {
        showToast(error.message);
      });
  }

  function setStatCard(card, label, value, change) {
    if (!card) {
      return;
    }
    var labelNode = $(".stat-label", card);
    var valueNode = $(".stat-value", card);
    var changeNode = $(".stat-change", card);
    if (labelNode) {
      labelNode.textContent = label;
    }
    if (valueNode) {
      valueNode.textContent = value;
    }
    if (changeNode) {
      changeNode.textContent = change;
    }
  }

  function renderHotProducts(products) {
    var table = $(".content-grid .card:nth-child(2) table tbody");
    if (!table) {
      return;
    }
    table.innerHTML = (products || []).slice().sort(function (a, b) {
      return Number(b.sales || 0) - Number(a.sales || 0);
    }).slice(0, 5).map(function (product) {
      return '<tr><td>' + escapeHtml(product.name) + '</td><td>' + Number(product.sales || 0) + ' 份</td></tr>';
    }).join("");
  }

  function renderTrend(orders) {
    var rows = $all(".chart-bars .bar-row");
    if (!rows.length) {
      return;
    }
    var labels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    var counts = labels.map(function () { return 0; });
    (orders || []).forEach(function (order) {
      var date = order.createdAt ? new Date(order.createdAt) : new Date();
      var index = (date.getDay() + 6) % 7;
      counts[index] += 1;
    });
    var max = Math.max.apply(Math, counts.concat([1]));
    rows.forEach(function (row, index) {
      $("span", row).textContent = labels[index];
      $(".bar span", row).style.width = Math.max(8, Math.round(counts[index] / max * 100)) + "%";
      $("strong", row).textContent = counts[index];
    });
  }

  function initProductsPage() {
    if (document.body.dataset.page !== "products") {
      return;
    }
    var tableBody = $("#productsTable tbody");
    showLoading(tableBody);
    Promise.all([get("/categories"), get("/admin/products")])
      .then(function (result) {
        state.categories = result[0] || [];
        state.products = result[1] || [];
        renderProductsTable();
        setupProductForm();
      })
      .catch(function (error) {
        showToast(error.message);
      });
  }

  function renderProductsTable() {
    var tableBody = $("#productsTable tbody");
    if (!tableBody) {
      return;
    }
    if (!state.products.length) {
      showLoading(tableBody, "暂无菜品数据");
      return;
    }
    tableBody.innerHTML = state.products.map(function (product) {
      return '<tr>' +
        '<td>' + escapeHtml(product.name) + '</td>' +
        '<td>' + escapeHtml(categoryName(product.categoryId)) + '</td>' +
        '<td>' + money(product.price) + '</td>' +
        '<td>' + Number(product.sales || 0) + '</td>' +
        '<td><span class="status ' + (product.enabled ? "green" : "red") + '">' + (product.enabled ? "在售" : "已下架") + '</span></td>' +
        '<td class="mini-actions">' +
          '<button class="link-btn" type="button" data-edit-product="' + escapeHtml(product.id) + '">编辑</button>' +
          '<button class="link-btn" type="button" data-disable-product="' + escapeHtml(product.id) + '">' + (product.enabled ? "下架" : "已下架") + '</button>' +
        '</td>' +
      '</tr>';
    }).join("");

    tableBody.onclick = handleProductTableClick;
  }

  function setupProductForm() {
    var formGrid = $(".form-grid");
    var saveButton = $(".card[style] .btn");
    var addButton = $(".toolbar .btn");
    if (!formGrid || !saveButton) {
      return;
    }
    formGrid.dataset.productForm = "true";
    formGrid.innerHTML = renderProductFormFields();
    saveButton.textContent = "保存到后端";
    saveButton.removeAttribute("data-toast");
    saveButton.type = "button";
    saveButton.addEventListener("click", saveProduct);
    if (addButton) {
      addButton.removeAttribute("data-toast");
      addButton.addEventListener("click", function () {
        fillProductForm(null);
        showToast("已切换为新增菜品");
      });
    }
    fillProductForm(null);
  }

  function renderProductFormFields() {
    var categoryOptions = state.categories.map(function (category) {
      return '<option value="' + escapeHtml(category.id) + '">' + escapeHtml(category.name) + '</option>';
    }).join("");
    return '<input type="hidden" name="id">' +
      '<div class="field"><label>菜品名称</label><input name="name" placeholder="例如：香草拿铁"></div>' +
      '<div class="field"><label>所属分类</label><select name="categoryId">' + categoryOptions + '</select></div>' +
      '<div class="field"><label>价格</label><input name="price" type="number" step="0.01" min="0.01" placeholder="16.90"></div>' +
      '<div class="field"><label>销量</label><input name="sales" type="number" min="0" placeholder="0"></div>' +
      '<div class="field"><label>标签</label><input name="tags" placeholder="例如：新品,热销"></div>' +
      '<div class="field"><label>状态</label><select name="enabled"><option value="true">在售</option><option value="false">下架</option></select></div>' +
      '<div class="field wide"><label>菜品描述</label><textarea name="description" placeholder="填写商品口味、卖点和备注"></textarea></div>';
  }

  function handleProductTableClick(event) {
    var editButton = event.target.closest("[data-edit-product]");
    var disableButton = event.target.closest("[data-disable-product]");
    if (editButton) {
      var product = state.products.find(function (item) {
        return item.id === editButton.dataset.editProduct;
      });
      fillProductForm(product);
    }
    if (disableButton && !disableButton.disabled) {
      disableButton.disabled = true;
      del("/admin/products/" + encodeURIComponent(disableButton.dataset.disableProduct))
        .then(function () {
          showToast("已下架，前台点餐页不会再展示该菜品");
          return reloadProducts();
        })
        .catch(function (error) {
          showToast(error.message);
        })
        .finally(function () {
          disableButton.disabled = false;
        });
    }
  }

  function fillProductForm(product) {
    var form = $("[data-product-form]");
    if (!form) {
      return;
    }
    form.querySelector("[name=id]").value = product ? product.id : "";
    form.querySelector("[name=name]").value = product ? product.name : "";
    form.querySelector("[name=categoryId]").value = product ? product.categoryId : (state.categories[0] && state.categories[0].id) || "";
    form.querySelector("[name=price]").value = product ? Number(product.price || 0).toFixed(2) : "";
    form.querySelector("[name=sales]").value = product ? Number(product.sales || 0) : "0";
    form.querySelector("[name=tags]").value = product && product.tags ? product.tags.join(",") : "";
    form.querySelector("[name=enabled]").value = product && !product.enabled ? "false" : "true";
    form.querySelector("[name=description]").value = product ? product.description : "";
    var note = $(".card[style] .muted");
    if (note) {
      note.textContent = product ? "正在编辑：" + product.name : "新增菜品会写入 MySQL，并显示到前台点餐页";
    }
  }

  function productFormPayload() {
    var form = $("[data-product-form]");
    var name = form.querySelector("[name=name]").value.trim();
    var categoryId = form.querySelector("[name=categoryId]").value;
    var price = Number(form.querySelector("[name=price]").value);
    if (!name || !categoryId || !price) {
      throw new Error("请填写菜品名称、分类和价格");
    }
    return {
      categoryId: categoryId,
      name: name,
      description: form.querySelector("[name=description]").value.trim(),
      image: "/images/food-placeholder.svg",
      price: price,
      sales: Number(form.querySelector("[name=sales]").value || 0),
      tags: form.querySelector("[name=tags]").value.split(",").map(function (tag) {
        return tag.trim();
      }).filter(Boolean),
      enabled: form.querySelector("[name=enabled]").value === "true"
    };
  }

  function saveProduct() {
    var form = $("[data-product-form]");
    if (!form) {
      return;
    }
    var productId = form.querySelector("[name=id]").value;
    var payload;
    try {
      payload = productFormPayload();
    } catch (error) {
      showToast(error.message);
      return;
    }
    var action = productId
      ? patch("/admin/products/" + encodeURIComponent(productId), payload)
      : post("/admin/products", payload);
    action.then(function () {
      showToast(productId ? "菜品已更新，前台同步生效" : "菜品已新增，前台同步生效");
      fillProductForm(null);
      return reloadProducts();
    }).catch(function (error) {
      showToast(error.message);
    });
  }

  function reloadProducts() {
    return get("/admin/products").then(function (products) {
      state.products = products || [];
      renderProductsTable();
    });
  }

  function initOrdersPage() {
    if (document.body.dataset.page !== "orders") {
      return;
    }
    var tableBody = $("#ordersTable tbody");
    showLoading(tableBody);
    get("/admin/orders")
      .then(function (orders) {
        state.orders = orders || [];
        renderOrdersTable();
      })
      .catch(function (error) {
        showToast(error.message);
      });
  }

  function renderOrdersTable() {
    var tableBody = $("#ordersTable tbody");
    if (!tableBody) {
      return;
    }
    if (!state.orders.length) {
      showLoading(tableBody, "暂无订单数据，前台提交订单后这里会出现");
      return;
    }
    tableBody.innerHTML = state.orders.map(function (order) {
      var goods = (order.items || []).map(function (item) {
        return item.productName + " x" + item.quantity;
      }).join("，");
      var action = order.status === "WAITING_PICKUP"
        ? '<button class="link-btn" type="button" data-complete-order="' + escapeHtml(order.id) + '">完成</button> ' +
          '<button class="link-btn" type="button" data-cancel-order="' + escapeHtml(order.id) + '">取消</button>'
        : '<button class="link-btn" type="button" data-show-order="' + escapeHtml(order.id) + '">详情</button>';
      return '<tr data-status="' + statusFilter(order.status) + '">' +
        '<td>' + escapeHtml(order.orderNo) + '</td>' +
        '<td>未登录用户</td>' +
        '<td>' + escapeHtml(goods) + '</td>' +
        '<td>' + money(order.payableAmount) + '</td>' +
        '<td>' + escapeHtml(pickupText(order.pickupType)) + '</td>' +
        '<td><span class="status ' + statusClass(order.status) + '">' + statusText(order.status) + '</span></td>' +
        '<td class="mini-actions">' + action + '</td>' +
      '</tr>';
    }).join("");
    tableBody.onclick = handleOrderTableClick;
  }

  function handleOrderTableClick(event) {
    var complete = event.target.closest("[data-complete-order]");
    var cancel = event.target.closest("[data-cancel-order]");
    if (complete) {
      patch("/admin/orders/" + encodeURIComponent(complete.dataset.completeOrder) + "/complete", {})
        .then(function () {
          showToast("订单已完成，前台订单状态同步变化");
          return reloadOrders();
        })
        .catch(function (error) { showToast(error.message); });
    }
    if (cancel) {
      patch("/admin/orders/" + encodeURIComponent(cancel.dataset.cancelOrder) + "/cancel", {})
        .then(function () {
          showToast("订单已取消，前台订单状态同步变化");
          return reloadOrders();
        })
        .catch(function (error) { showToast(error.message); });
    }
  }

  function reloadOrders() {
    return get("/admin/orders").then(function (orders) {
      state.orders = orders || [];
      renderOrdersTable();
    });
  }

  function initCategoriesPage() {
    if (document.body.dataset.page !== "categories") {
      return;
    }
    Promise.all([get("/admin/categories"), get("/admin/products")])
      .then(function (result) {
        state.categories = result[0] || [];
        state.products = result[1] || [];
        renderCategoryList();
        setupCategoryForm();
      })
      .catch(function (error) { showToast(error.message); });
  }

  function renderCategoryList() {
    var list = $(".category-list");
    if (!list) {
      return;
    }
    list.innerHTML = state.categories.map(function (category) {
      var count = state.products.filter(function (product) {
        return product.categoryId === category.id;
      }).length;
      return '<div class="small-card"><strong>' + escapeHtml(category.name) + '</strong>' +
        '<p class="muted">' + count + ' 个菜品，排序 ' + Number(category.sort || 0) + '</p>' +
        '<div class="mini-actions">' +
          '<button class="link-btn" type="button" data-edit-category="' + escapeHtml(category.id) + '">编辑</button>' +
          '<button class="link-btn" type="button" data-delete-category="' + escapeHtml(category.id) + '">删除</button>' +
        '</div></div>';
    }).join("");
    list.onclick = handleCategoryClick;
  }

  function setupCategoryForm() {
    var formGrid = $(".form-grid");
    var saveButton = $(".card[style] .btn");
    if (!formGrid || !saveButton) {
      return;
    }
    formGrid.dataset.categoryForm = "true";
    formGrid.innerHTML = '<input type="hidden" name="id">' +
      '<div class="field"><label>分类名称</label><input name="name" placeholder="例如：新品专区"></div>' +
      '<div class="field"><label>排序值</label><input name="sort" type="number" min="1" placeholder="5"></div>';
    saveButton.removeAttribute("data-toast");
    saveButton.textContent = "保存分类";
    saveButton.onclick = saveCategory;
    fillCategoryForm(null);
  }

  function handleCategoryClick(event) {
    var edit = event.target.closest("[data-edit-category]");
    var remove = event.target.closest("[data-delete-category]");
    if (edit) {
      var category = state.categories.find(function (item) {
        return item.id === edit.dataset.editCategory;
      });
      fillCategoryForm(category);
    }
    if (remove) {
      del("/admin/categories/" + encodeURIComponent(remove.dataset.deleteCategory))
        .then(function () {
          showToast("分类已删除");
          return reloadCategories();
        })
        .catch(function (error) { showToast(error.message); });
    }
  }

  function fillCategoryForm(category) {
    var form = $("[data-category-form]");
    if (!form) {
      return;
    }
    form.querySelector("[name=id]").value = category ? category.id : "";
    form.querySelector("[name=name]").value = category ? category.name : "";
    form.querySelector("[name=sort]").value = category ? Number(category.sort || 1) : String(state.categories.length + 1);
    var note = $(".card[style] .muted");
    if (note) {
      note.textContent = category ? "正在编辑：" + category.name : "新增分类会写入 MySQL，并同步到前台点餐页";
    }
  }

  function saveCategory() {
    var form = $("[data-category-form]");
    var categoryId = form.querySelector("[name=id]").value;
    var payload = {
      name: form.querySelector("[name=name]").value.trim(),
      sort: Number(form.querySelector("[name=sort]").value || 1)
    };
    if (!payload.name) {
      showToast("请填写分类名称");
      return;
    }
    var action = categoryId
      ? patch("/admin/categories/" + encodeURIComponent(categoryId), payload)
      : post("/admin/categories", payload);
    action.then(function () {
      showToast(categoryId ? "分类已更新" : "分类已新增");
      return reloadCategories();
    }).then(function () {
      fillCategoryForm(null);
    }).catch(function (error) {
      showToast(error.message);
    });
  }

  function reloadCategories() {
    return Promise.all([get("/admin/categories"), get("/admin/products")]).then(function (result) {
      state.categories = result[0] || [];
      state.products = result[1] || [];
      renderCategoryList();
    });
  }

  function initCouponsPage() {
    if (document.body.dataset.page !== "coupons") {
      return;
    }
    get("/admin/coupons").then(function (coupons) {
      state.coupons = coupons || [];
      renderCouponList();
      setupCouponForm();
    }).catch(function (error) { showToast(error.message); });
  }

  function renderCouponList() {
    var list = $(".coupon-list");
    if (!list) {
      return;
    }
    list.innerHTML = (state.coupons || []).map(function (coupon) {
      return '<div class="small-card"><strong>' + escapeHtml(coupon.title) + '</strong>' +
        '<p class="muted">' + escapeHtml(coupon.conditionText) + '，减 ' + money(coupon.discountAmount) + '，有效期至 ' + escapeHtml(coupon.validUntil) + '</p>' +
        '<p><span class="status ' + (coupon.available ? "green" : "red") + '">' + (coupon.available ? "启用" : "停用") + '</span></p>' +
        '<div class="mini-actions">' +
          '<button class="link-btn" type="button" data-edit-coupon="' + escapeHtml(coupon.id) + '">编辑</button>' +
          '<button class="link-btn" type="button" data-disable-coupon="' + escapeHtml(coupon.id) + '">停用</button>' +
        '</div></div>';
    }).join("");
    list.onclick = handleCouponClick;
  }

  function setupCouponForm() {
    var formGrid = $(".form-grid");
    var saveButton = $(".card[style] .btn");
    if (!formGrid || !saveButton) {
      return;
    }
    formGrid.dataset.couponForm = "true";
    formGrid.innerHTML = '<input type="hidden" name="id">' +
      '<div class="field"><label>券名称</label><input name="title" placeholder="例如：周末满减券"></div>' +
      '<div class="field"><label>优惠金额</label><input name="discountAmount" type="number" step="0.01" min="0.01" placeholder="5.00"></div>' +
      '<div class="field"><label>使用门槛</label><input name="conditionText" placeholder="满 20 元可用"></div>' +
      '<div class="field"><label>有效期</label><input name="validUntil" placeholder="2026-12-31"></div>' +
      '<div class="field"><label>状态</label><select name="available"><option value="true">启用</option><option value="false">停用</option></select></div>';
    saveButton.removeAttribute("data-toast");
    saveButton.textContent = "保存优惠券";
    saveButton.onclick = saveCoupon;
    fillCouponForm(null);
  }

  function handleCouponClick(event) {
    var edit = event.target.closest("[data-edit-coupon]");
    var disable = event.target.closest("[data-disable-coupon]");
    if (edit) {
      var coupon = state.coupons.find(function (item) {
        return item.id === edit.dataset.editCoupon;
      });
      fillCouponForm(coupon);
    }
    if (disable) {
      del("/admin/coupons/" + encodeURIComponent(disable.dataset.disableCoupon))
        .then(function () {
          showToast("优惠券已停用，提交订单页不会再使用");
          return reloadCoupons();
        })
        .catch(function (error) { showToast(error.message); });
    }
  }

  function fillCouponForm(coupon) {
    var form = $("[data-coupon-form]");
    if (!form) {
      return;
    }
    form.querySelector("[name=id]").value = coupon ? coupon.id : "";
    form.querySelector("[name=title]").value = coupon ? coupon.title : "";
    form.querySelector("[name=discountAmount]").value = coupon ? Number(coupon.discountAmount || 0).toFixed(2) : "";
    form.querySelector("[name=conditionText]").value = coupon ? coupon.conditionText : "";
    form.querySelector("[name=validUntil]").value = coupon ? coupon.validUntil : "2026-12-31";
    form.querySelector("[name=available]").value = coupon && !coupon.available ? "false" : "true";
    var note = $(".card[style] .muted");
    if (note) {
      note.textContent = coupon ? "正在编辑：" + coupon.title : "新增优惠券会写入 MySQL，并同步到提交订单页";
    }
  }

  function saveCoupon() {
    var form = $("[data-coupon-form]");
    var couponId = form.querySelector("[name=id]").value;
    var payload = {
      title: form.querySelector("[name=title]").value.trim(),
      discountAmount: Number(form.querySelector("[name=discountAmount]").value),
      conditionText: form.querySelector("[name=conditionText]").value.trim(),
      validUntil: form.querySelector("[name=validUntil]").value.trim(),
      available: form.querySelector("[name=available]").value === "true"
    };
    if (!payload.title || !payload.conditionText || !payload.discountAmount || !payload.validUntil) {
      showToast("请填写优惠券名称、金额、门槛和有效期");
      return;
    }
    var action = couponId
      ? patch("/admin/coupons/" + encodeURIComponent(couponId), payload)
      : post("/admin/coupons", payload);
    action.then(function () {
      showToast(couponId ? "优惠券已更新" : "优惠券已新增");
      return reloadCoupons();
    }).then(function () {
      fillCouponForm(null);
    }).catch(function (error) {
      showToast(error.message);
    });
  }

  function reloadCoupons() {
    return get("/admin/coupons").then(function (coupons) {
      state.coupons = coupons || [];
      renderCouponList();
    });
  }

  function initUsersPage() {
    if (document.body.dataset.page !== "users") {
      return;
    }
    Promise.all([get("/admin/users"), get("/admin/orders")])
      .then(function (result) {
        var users = result[0] || [];
        var orders = result[1] || [];
        var tableBody = $("#usersTable tbody");
        if (!tableBody) {
          return;
        }
        tableBody.innerHTML = users.map(function (user) {
          var paid = orders.filter(function (order) {
            return order.userId === user.userId && order.status !== "CANCELED";
          }).reduce(function (sum, order) {
            return sum + Number(order.payableAmount || 0);
          }, 0);
          return '<tr><td>' + escapeHtml(user.nickname) + '</td>' +
            '<td>' + escapeHtml(user.memberLevel) + '</td>' +
            '<td>' + Number(user.points || 0) + '</td>' +
            '<td>' + Number(user.couponCount || 0) + ' 张</td>' +
            '<td>' + money(paid) + '</td>' +
            '<td><span class="status green">正常</span></td></tr>';
        }).join("") || '<tr><td colspan="6" class="muted-cell">暂无用户数据</td></tr>';
      })
      .catch(function (error) { showToast(error.message); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!initAuthGuard()) {
      return;
    }
    initNav();
    initLogin();
    initSearch();
    initTabs();
    initButtons();
    initDate();
    initDashboardPage();
    initProductsPage();
    initOrdersPage();
    initCategoriesPage();
    initCouponsPage();
    initUsersPage();
  });
})();
