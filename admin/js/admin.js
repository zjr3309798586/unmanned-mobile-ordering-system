(function () {
  var state = {
    categories: [],
    products: [],
    orders: []
  };

  var defaultApiBaseUrl = window.location.protocol === "file:"
    ? "http://127.0.0.1:8080/api"
    : window.location.origin + "/api";
  var apiBaseUrl = localStorage.getItem("orderingApiBaseUrl") || defaultApiBaseUrl;

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function request(path, options) {
    var config = options || {};
    config.headers = Object.assign({ "Content-Type": "application/json" }, config.headers || {});
    if (config.body && typeof config.body !== "string") {
      config.body = JSON.stringify(config.body);
    }
    return fetch(apiBaseUrl + path, config)
      .then(function (response) {
        return response.json().then(function (payload) {
          if (!response.ok || payload.success === false) {
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

  function initLogin() {
    var form = $("#loginForm");
    if (!form) {
      return;
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      localStorage.setItem("umo-admin-login", "true");
      window.location.href = "dashboard.html";
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
        localStorage.removeItem("umo-admin-login");
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
    Promise.all([get("/admin/dashboard"), get("/admin/products"), get("/orders")])
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
    get("/orders")
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
        '<td>访客用户</td>' +
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
      patch("/orders/" + encodeURIComponent(cancel.dataset.cancelOrder) + "/cancel", {})
        .then(function () {
          showToast("订单已取消，前台订单状态同步变化");
          return reloadOrders();
        })
        .catch(function (error) { showToast(error.message); });
    }
  }

  function reloadOrders() {
    return get("/orders").then(function (orders) {
      state.orders = orders || [];
      renderOrdersTable();
    });
  }

  function initCategoriesPage() {
    if (document.body.dataset.page !== "categories") {
      return;
    }
    Promise.all([get("/categories"), get("/admin/products")])
      .then(function (result) {
        state.categories = result[0] || [];
        state.products = result[1] || [];
        var list = $(".category-list");
        if (!list) {
          return;
        }
        list.innerHTML = state.categories.map(function (category) {
          var count = state.products.filter(function (product) {
            return product.categoryId === category.id && product.enabled;
          }).length;
          return '<div class="small-card"><strong>' + escapeHtml(category.name) + '</strong>' +
            '<p class="muted">' + count + ' 个在售菜品，排序 ' + category.sortOrder + '</p>' +
            '<button class="link-btn" type="button" data-toast="分类接口当前只读，菜品管理会使用这些分类">查看</button></div>';
        }).join("");
      })
      .catch(function (error) { showToast(error.message); });
  }

  function initCouponsPage() {
    if (document.body.dataset.page !== "coupons") {
      return;
    }
    get("/coupons").then(function (coupons) {
      var list = $(".coupon-list");
      if (!list) {
        return;
      }
      list.innerHTML = (coupons || []).map(function (coupon) {
        return '<div class="small-card"><strong>' + escapeHtml(coupon.title) + '</strong>' +
          '<p class="muted">' + escapeHtml(coupon.conditionText) + '，减 ' + money(coupon.discountAmount) + '，有效期至 ' + escapeHtml(coupon.validUntil) + '</p>' +
          '<button class="link-btn" type="button" data-toast="提交订单页会读取这张优惠券">已接前台</button></div>';
      }).join("");
    }).catch(function (error) { showToast(error.message); });
  }

  function initUsersPage() {
    if (document.body.dataset.page !== "users") {
      return;
    }
    Promise.all([get("/mine"), get("/orders")])
      .then(function (result) {
        var user = result[0];
        var orders = result[1] || [];
        var paid = orders.filter(function (order) {
          return order.status !== "CANCELED";
        }).reduce(function (sum, order) {
          return sum + Number(order.payableAmount || 0);
        }, 0);
        var tableBody = $("#usersTable tbody");
        if (!tableBody) {
          return;
        }
        tableBody.innerHTML = '<tr><td>' + escapeHtml(user.nickname) + '</td>' +
          '<td>' + escapeHtml(user.memberLevel) + '</td>' +
          '<td>' + Number(user.points || 0) + '</td>' +
          '<td>' + Number(user.couponCount || 0) + ' 张</td>' +
          '<td>' + money(paid) + '</td>' +
          '<td><span class="status green">正常</span></td></tr>';
      })
      .catch(function (error) { showToast(error.message); });
  }

  document.addEventListener("DOMContentLoaded", function () {
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
