(function () {
  var state = {
    categories: [],
    products: [],
    orders: [],
    users: [],
    coupons: [],
    banners: []
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

  function uploadImage(file) {
    var formData = new FormData();
    formData.append("file", file);
    return fetch(apiBaseUrl + "/admin/uploads/images", {
      method: "POST",
      headers: { "X-Admin-Token": adminToken() },
      body: formData
    }).then(function (response) {
      return response.json().then(function (payload) {
        if (!response.ok || payload.success === false) {
          throw new Error(payload.message || "图片上传失败");
        }
        return payload.data;
      });
    });
  }

  function bindImagePreview(root) {
    var fileInput = root.querySelector("[name=imageFile]");
    var preview = root.querySelector(".image-preview");
    if (!fileInput || !preview) {
      return;
    }
    fileInput.addEventListener("change", function () {
      var file = fileInput.files[0];
      if (file) {
        preview.src = URL.createObjectURL(file);
      }
    });
  }

  function money(value) {
    return "¥ " + Number(value || 0).toFixed(2);
  }

  // 已知的图片子目录(若路径已带子目录则不再补)
  var IMG_DIRS = ["nav", "home", "menu", "mine", "saving", "mascot", "common", "icons"];

  // 按文件名前缀推断子目录(用于把后端返回的旧扁平路径自动重写到子目录)
  function guessImgSubdir(filename) {
    if (/^nav-/.test(filename)) return "nav";
    if (/^home-/.test(filename)) return "home";
    if (/^menu-product-/.test(filename)) return "menu";
    if (/^product-/.test(filename)) return "menu";
    if (/^mine-/.test(filename)) return "mine";
    if (/^saving-/.test(filename)) return "saving";
    if (/^icon-(delivery|pickup)-/.test(filename)) return "saving";
    if (/^mascot-yunbao/.test(filename)) return "mascot";
    if (/-placeholder\.svg$/.test(filename)) return "common";
    return null;
  }

  function assetUrl(value) {
    var fallback = "../images/common/food-placeholder.svg";
    if (!value) return fallback;
    if (value.indexOf("/images/") === 0) {
      var rest = value.substring("/images/".length);
      var head = rest.split("/")[0];
      // 已带子目录,直接拼上 ../
      if (IMG_DIRS.indexOf(head) !== -1) return ".." + value;
      // 旧扁平路径,按文件名前缀自动补子目录
      var filename = rest.split("/").pop();
      var sub = guessImgSubdir(filename);
      return sub ? "../images/" + sub + "/" + filename : fallback;
    }
    return value;
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
    return "blue";
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

  function userName(userId) {
    var user = state.users.find(function (item) {
      return item.userId === userId;
    });
    return user ? user.nickname : (userId ? "用户 " + userId.slice(-6) : "游客用户");
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
      var table = node.closest("table");
      var columnCount = table ? Math.max($all("thead th", table).length, 1) : 1;
      node.innerHTML = '<tr><td colspan="' + columnCount + '" class="table-empty">' + escapeHtml(text || "正在加载数据...") + '</td></tr>';
    }
  }

  function withLoading(button, promise) {
    if (!button) return promise;
    var originalText = button.textContent;
    button.disabled = true;
    button.textContent = "保存中...";
    return promise.finally(function () {
      button.disabled = false;
      button.textContent = originalText;
    });
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
      var overlay = document.createElement("div");
      overlay.className = "sidebar-overlay";
      document.body.appendChild(overlay);
      menuToggle.addEventListener("click", function () {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("show");
      });
      overlay.addEventListener("click", function () {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
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

  function initAdminUser() {
    var username = localStorage.getItem("umo-admin-username") || "管理员";
    var avatarLetter = username.charAt(0).toUpperCase();
    $all(".admin-user").forEach(function (el) {
      var avatar = $(".avatar", el);
      var nameSpan = el.querySelector("span:last-child");
      if (avatar) {
        avatar.textContent = avatarLetter;
      }
      if (nameSpan && nameSpan !== avatar) {
        nameSpan.textContent = username;
      }
    });
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
        setStatCard(statCards[2], "在售商品", dashboard.productCount, "商品管理下架后会减少");
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
    var now = new Date();
    var sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    (orders || []).forEach(function (order) {
      var date = order.createdAt ? new Date(order.createdAt) : null;
      if (!date || date < sevenDaysAgo) return;
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
        showLoading(tableBody, "加载失败，请刷新重试");
      });
  }

  function renderProductsTable() {
    var tableBody = $("#productsTable tbody");
    if (!tableBody) {
      return;
    }
    if (!state.products.length) {
      showLoading(tableBody, "暂无商品数据");
      return;
    }
    tableBody.innerHTML = state.products.map(function (product) {
      return '<tr>' +
        '<td><img class="table-thumb" src="' + escapeHtml(assetUrl(product.image)) + '" alt="' + escapeHtml(product.name) + '" onerror="this.src=\'../images/common/food-placeholder.svg\'"></td>' +
        '<td>' + escapeHtml(product.name) + '</td>' +
        '<td>' + escapeHtml(categoryName(product.categoryId)) + '</td>' +
        '<td>' + money(product.price) + '</td>' +
        '<td>' + Number(product.sales || 0) + '</td>' +
        '<td><span class="status ' + (product.enabled ? "green" : "red") + '">' + (product.enabled ? "在售" : "已下架") + '</span></td>' +
        '<td class="mini-actions">' +
          '<button class="link-btn" type="button" data-edit-product="' + escapeHtml(product.id) + '">编辑</button>' +
          (product.enabled ? '<button class="link-btn" type="button" data-disable-product="' + escapeHtml(product.id) + '">下架</button>' : '<button class="link-btn" type="button" disabled style="opacity:0.5;cursor:not-allowed">已下架</button>') +
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
    bindImagePreview(formGrid);
  saveButton.textContent = "保存";
    saveButton.removeAttribute("data-toast");
    saveButton.type = "button";
    saveButton.addEventListener("click", saveProduct);
    if (addButton) {
      addButton.removeAttribute("data-toast");
      addButton.addEventListener("click", function () {
        fillProductForm(null);
        showToast("已切换为新增商品");
      });
    }
    fillProductForm(null);
  }

  function renderProductFormFields() {
    var categoryOptions = state.categories.map(function (category) {
      return '<option value="' + escapeHtml(category.id) + '">' + escapeHtml(category.name) + '</option>';
    }).join("");
    return '<input type="hidden" name="id">' +
      '<div class="field"><label>商品名称</label><input name="name" placeholder="香草拿铁"></div>' +
      '<div class="field"><label>所属分类</label><select name="categoryId">' + categoryOptions + '</select></div>' +
      '<div class="field"><label>价格</label><input name="price" type="number" step="0.01" min="0.01" placeholder="16.90"></div>' +
      '<div class="field"><label>销量</label><input name="sales" type="number" min="0" placeholder="0"></div>' +
      '<div class="field"><label>标签</label><input name="tags" placeholder="新品,热销"></div>' +
      '<div class="field"><label>状态</label><select name="enabled"><option value="true">在售</option><option value="false">下架</option></select></div>' +
      '<div class="field wide image-field"><label>商品图片</label><input name="image" placeholder="/images/common/food-placeholder.svg"><input name="imageFile" type="file" accept="image/*"><img class="image-preview" alt="商品图片预览"></div>' +
      '<div class="field wide"><label>商品描述</label><textarea name="description" placeholder="填写商品口味、卖点和备注"></textarea></div>';
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
      if (!confirm("确定要下架该商品吗？下架后前台点餐页将不再显示。")) {
        return;
      }
      disableButton.disabled = true;
      del("/admin/products/" + encodeURIComponent(disableButton.dataset.disableProduct))
        .then(function () {
        showToast("已下架，前台点餐页不会再显示该商品");
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
    form.querySelector("[name=image]").value = product && product.image ? product.image : "/images/common/food-placeholder.svg";
    form.querySelector(".image-preview").src = assetUrl(form.querySelector("[name=image]").value);
    form.querySelector("[name=description]").value = product ? product.description : "";
    var note = $(".card[style] .muted");
    if (note) {
  note.textContent = product ? "正在编辑：" + product.name : "新增商品保存后会显示到前台点餐页";
    }
  }

  function productFormPayload() {
    var form = $("[data-product-form]");
    var name = form.querySelector("[name=name]").value.trim();
    var categoryId = form.querySelector("[name=categoryId]").value;
    var price = Number(form.querySelector("[name=price]").value);
    if (!name || !categoryId || !price) {
      throw new Error("请填写商品名称、分类和价格");
    }
    return {
      categoryId: categoryId,
      name: name,
      description: form.querySelector("[name=description]").value.trim(),
      image: form.querySelector("[name=image]").value.trim() || "/images/common/food-placeholder.svg",
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
    var saveBtn = $(".card[style] .btn");
    var productId = form.querySelector("[name=id]").value;
    var payload;
    try {
      payload = productFormPayload();
    } catch (error) {
      showToast(error.message);
      return;
    }
    var file = form.querySelector("[name=imageFile]").files[0];
    var action = (file ? uploadImage(file).then(function (result) {
      payload.image = result.path;
    }) : Promise.resolve()).then(function () {
      return productId
        ? patch("/admin/products/" + encodeURIComponent(productId), payload)
        : post("/admin/products", payload);
    });
    withLoading(saveBtn, action.then(function () {
      showToast(productId ? "商品已更新，前台同步生效" : "商品已新增，前台同步生效");
      fillProductForm(null);
      return reloadProducts();
    }).catch(function (error) {
      showToast(error.message);
    }));
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
    Promise.all([get("/admin/orders"), get("/admin/users")])
      .then(function (result) {
        state.orders = result[0] || [];
        state.users = result[1] || [];
        renderOrdersTable();
      })
      .catch(function (error) {
        showToast(error.message);
        showLoading(tableBody, "加载失败，请刷新重试");
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
        '<td>' + escapeHtml(userName(order.userId)) + '</td>' +
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
    var show = event.target.closest("[data-show-order]");
    if (complete) {
      if (!confirm("确定将该订单标记为已完成吗？")) {
        return;
      }
      patch("/admin/orders/" + encodeURIComponent(complete.dataset.completeOrder) + "/complete", {})
        .then(function () {
          showToast("订单已完成，前台订单状态同步变化");
          return reloadOrders();
        })
        .catch(function (error) { showToast(error.message); });
    }
    if (cancel) {
      if (!confirm("确定要取消该订单吗？取消后将回滚销量和优惠券。")) {
        return;
      }
      patch("/admin/orders/" + encodeURIComponent(cancel.dataset.cancelOrder) + "/cancel", {})
        .then(function () {
          showToast("订单已取消，前台订单状态同步变化");
          return reloadOrders();
        })
        .catch(function (error) { showToast(error.message); });
    }
    if (show) {
      var order = state.orders.find(function (item) {
        return item.id === show.dataset.showOrder;
      });
      if (order) {
        showOrderDetail(order);
      }
    }
  }

  function showOrderDetail(order) {
    var goods = (order.items || []).map(function (item) {
      return item.productName + " x" + item.quantity + "  " + money(item.price);
    }).join("\n");
    var info = "订单号：" + order.orderNo +
      "\n用户：" + userName(order.userId) +
      "\n状态：" + statusText(order.status) +
      "\n取餐方式：" + pickupText(order.pickupType) +
      "\n商品明细：\n" + (goods || "无") +
      "\n\n原价：" + money(order.totalAmount) +
      "\n优惠：-" + money(order.discountAmount) +
      "\n实付：" + money(order.payableAmount) +
      "\n下单时间：" + (order.createdAt || "--");
    alert(info);
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
      .catch(function (error) {
        showToast(error.message);
        var list = $(".category-list");
        if (list) list.innerHTML = '<div class="small-card"><strong>加载失败</strong><p class="muted">请刷新页面重试</p></div>';
      });
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
        '<p class="muted">' + count + ' 个商品，排序 ' + Number(category.sort || 0) + '</p>' +
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
      '<div class="field"><label>分类名称</label><input name="name" placeholder="新品专区"></div>' +
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
      if (!confirm("确定要删除该分类吗？删除后无法恢复。")) {
        return;
      }
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
  note.textContent = category ? "正在编辑：" + category.name : "新增分类保存后会同步到前台点餐页";
    }
  }

  function saveCategory() {
    var form = $("[data-category-form]");
    var saveBtn = $(".card[style] .btn");
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
    withLoading(saveBtn, action.then(function () {
      showToast(categoryId ? "分类已更新" : "分类已新增");
      return reloadCategories();
    }).then(function () {
      fillCategoryForm(null);
    }).catch(function (error) {
      showToast(error.message);
    }));
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
    }).catch(function (error) {
      showToast(error.message);
      var list = $(".coupon-list");
      if (list) list.innerHTML = '<div class="small-card"><strong>加载失败</strong><p class="muted">请刷新页面重试</p></div>';
    });
  }

  function renderCouponList() {
    var list = $(".coupon-list");
    if (!list) {
      return;
    }
    list.innerHTML = (state.coupons || []).map(function (coupon) {
      return '<div class="small-card"><strong>' + escapeHtml(coupon.title) + '</strong>' +
        '<p class="muted">满 ' + money(coupon.minAmount) + ' 可用，减 ' + money(coupon.discountAmount) + '，有效期至 ' + escapeHtml(coupon.validUntil) + '</p>' +
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
      '<div class="field"><label>券名称</label><input name="title" placeholder="周末满减券"></div>' +
      '<div class="field"><label>优惠金额</label><input name="discountAmount" type="number" step="0.01" min="0.01" placeholder="5.00"></div>' +
      '<div class="field"><label>使用门槛金额</label><input name="minAmount" type="number" step="0.01" min="0" placeholder="20.00"></div>' +
      '<div class="field"><label>门槛说明</label><input name="conditionText" placeholder="满 20 元可用"></div>' +
      '<div class="field"><label>有效期</label><input name="validUntil" type="date" placeholder="2026-12-31"></div>' +
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
      if (!confirm("确定要停用该优惠券吗？停用后用户将无法使用。")) {
        return;
      }
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
    form.querySelector("[name=minAmount]").value = coupon ? Number(coupon.minAmount || 0).toFixed(2) : "";
    form.querySelector("[name=conditionText]").value = coupon ? coupon.conditionText : "";
    form.querySelector("[name=validUntil]").value = coupon ? coupon.validUntil : "2026-12-31";
    form.querySelector("[name=available]").value = coupon && !coupon.available ? "false" : "true";
    var note = $(".card[style] .muted");
    if (note) {
  note.textContent = coupon ? "正在编辑：" + coupon.title : "新增优惠券保存后可在提交订单页使用";
    }
  }

  function saveCoupon() {
    var form = $("[data-coupon-form]");
    var saveBtn = $(".card[style] .btn");
    var couponId = form.querySelector("[name=id]").value;
    var payload = {
      title: form.querySelector("[name=title]").value.trim(),
      discountAmount: Number(form.querySelector("[name=discountAmount]").value),
      minAmount: Number(form.querySelector("[name=minAmount]").value || 0),
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
    withLoading(saveBtn, action.then(function () {
      showToast(couponId ? "优惠券已更新" : "优惠券已新增");
      return reloadCoupons();
    }).then(function () {
      fillCouponForm(null);
    }).catch(function (error) {
      showToast(error.message);
    }));
  }

  function reloadCoupons() {
    return get("/admin/coupons").then(function (coupons) {
      state.coupons = coupons || [];
      renderCouponList();
    });
  }

  function initActivitiesPage() {
    if (document.body.dataset.page !== "activities") {
      return;
    }
    Promise.all([get("/admin/banners")]).then(function (result) {
      state.banners = result[0] || [];
      renderBannerList();
      setupBannerForm();
    }).catch(function (error) {
      showToast(error.message);
      var list = $(".activity-list");
      if (list) list.innerHTML = '<div class="small-card"><strong>加载失败</strong><p class="muted">请刷新页面重试</p></div>';
    });
  }

  function renderBannerList() {
    var list = $(".activity-list");
    if (!list) {
      return;
    }
    if (!state.banners.length) {
      list.innerHTML = '<div class="small-card"><strong>暂无 Banner</strong><p class="muted">可在下方新增首页活动位。</p></div>';
      return;
    }
    list.innerHTML = state.banners.map(function (banner) {
      return '<div class="small-card banner-card">' +
        '<img class="image-preview" src="' + escapeHtml(assetUrl(banner.image)) + '" alt="Banner 图片">' +
        '<strong>' + escapeHtml(banner.title) + '</strong>' +
        '<p class="muted">' + escapeHtml(banner.subtitle || "") + '</p>' +
        '<p><span class="status ' + (banner.enabled ? "green" : "red") + '">' + (banner.enabled ? "启用" : "停用") + '</span></p>' +
        '<div class="mini-actions">' +
          '<button class="link-btn" type="button" data-edit-banner="' + escapeHtml(banner.id) + '">编辑</button>' +
          '<button class="link-btn" type="button" data-disable-banner="' + escapeHtml(banner.id) + '">停用</button>' +
        '</div></div>';
    }).join("");
    list.onclick = handleBannerClick;
  }

  function setupBannerForm() {
    var formGrid = $(".form-grid");
    var saveButton = $(".card[style] .btn");
    if (!formGrid || !saveButton) {
      return;
    }
    formGrid.dataset.bannerForm = "true";
    formGrid.innerHTML = '<input type="hidden" name="id">' +
      '<div class="field"><label>Banner 标题</label><input name="title" placeholder="蓝杯鲜饮 轻松点单"></div>' +
      '<div class="field"><label>角标文字</label><input name="tagText" placeholder="云豹上新"></div>' +
      '<div class="field wide"><label>副标题</label><input name="subtitle" placeholder="活动说明"></div>' +
      '<div class="field"><label>按钮文字</label><input name="linkText" placeholder="去点餐"></div>' +
      '<div class="field"><label>跳转地址</label><input name="linkUrl" placeholder="menu.html"></div>' +
      '<div class="field"><label>排序</label><input name="sort" type="number" min="0" placeholder="1"></div>' +
      '<div class="field"><label>状态</label><select name="enabled"><option value="true">启用</option><option value="false">停用</option></select></div>' +
      '<div class="field wide image-field"><label>Banner 图片</label><input name="image" placeholder="/images/common/food-placeholder.svg"><input name="imageFile" type="file" accept="image/*"><img class="image-preview" alt="Banner 图片预览"></div>';
    bindImagePreview(formGrid);
    saveButton.removeAttribute("data-toast");
    saveButton.textContent = "保存 Banner";
    saveButton.onclick = saveBanner;
    fillBannerForm(null);
  }

  function handleBannerClick(event) {
    var edit = event.target.closest("[data-edit-banner]");
    var disable = event.target.closest("[data-disable-banner]");
    if (edit) {
      var banner = state.banners.find(function (item) {
        return item.id === edit.dataset.editBanner;
      });
      fillBannerForm(banner);
    }
    if (disable) {
      if (!confirm("确定要停用该 Banner 吗？停用后首页将不再展示。")) {
        return;
      }
      del("/admin/banners/" + encodeURIComponent(disable.dataset.disableBanner))
        .then(function () {
          showToast("Banner 已停用");
          return reloadBanners();
        })
        .catch(function (error) { showToast(error.message); });
    }
  }

  function fillBannerForm(banner) {
    var form = $("[data-banner-form]");
    if (!form) {
      return;
    }
    form.querySelector("[name=id]").value = banner ? banner.id : "";
    form.querySelector("[name=title]").value = banner ? banner.title : "";
    form.querySelector("[name=tagText]").value = banner ? banner.tagText : "";
    form.querySelector("[name=subtitle]").value = banner ? banner.subtitle : "";
    form.querySelector("[name=linkText]").value = banner ? banner.linkText : "去点餐";
    form.querySelector("[name=linkUrl]").value = banner ? banner.linkUrl : "menu.html";
    form.querySelector("[name=sort]").value = banner ? Number(banner.sort || 0) : "1";
    form.querySelector("[name=enabled]").value = banner && !banner.enabled ? "false" : "true";
    form.querySelector("[name=image]").value = banner && banner.image ? banner.image : "/images/common/food-placeholder.svg";
    form.querySelector(".image-preview").src = assetUrl(form.querySelector("[name=image]").value);
  }

  function saveBanner() {
    var form = $("[data-banner-form]");
    var saveBtn = $(".card[style] .btn");
    var bannerId = form.querySelector("[name=id]").value;
    var payload = {
      title: form.querySelector("[name=title]").value.trim(),
      subtitle: form.querySelector("[name=subtitle]").value.trim(),
      tagText: form.querySelector("[name=tagText]").value.trim(),
      image: form.querySelector("[name=image]").value.trim() || "/images/common/food-placeholder.svg",
      linkText: form.querySelector("[name=linkText]").value.trim(),
      linkUrl: form.querySelector("[name=linkUrl]").value.trim(),
      sort: Number(form.querySelector("[name=sort]").value || 0),
      enabled: form.querySelector("[name=enabled]").value === "true"
    };
    if (!payload.title) {
      showToast("请填写 Banner 标题");
      return;
    }
    var file = form.querySelector("[name=imageFile]").files[0];
    var action = (file ? uploadImage(file).then(function (result) {
      payload.image = result.path;
    }) : Promise.resolve()).then(function () {
      return bannerId
        ? patch("/admin/banners/" + encodeURIComponent(bannerId), payload)
        : post("/admin/banners", payload);
    });
    withLoading(saveBtn, action.then(function () {
      showToast(bannerId ? "Banner 已更新" : "Banner 已新增");
      return reloadBanners();
    }).then(function () {
      fillBannerForm(null);
    }).catch(function (error) {
      showToast(error.message);
    }));
  }

  function reloadBanners() {
    return get("/admin/banners").then(function (banners) {
      state.banners = banners || [];
      renderBannerList();
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
      .catch(function (error) {
        showToast(error.message);
        var tableBody = $("#usersTable tbody");
        if (tableBody) {
          showLoading(tableBody, "加载失败，请刷新重试");
        }
      });
  }

  function initAnalyticsPage() {
    if (document.body.dataset.page !== "analytics") {
      return;
    }
    Promise.all([get("/admin/orders"), get("/admin/products"), get("/admin/categories"), get("/admin/users")])
      .then(function (result) {
        var orders = result[0] || [];
        var products = result[1] || [];
        var categories = result[2] || [];
        var users = result[3] || [];
        renderAnalyticsStats(orders, users);
        renderCategorySales(products, categories);
        renderBusinessNotes(orders, products);
      })
      .catch(function (error) {
        showToast("统计数据加载失败：" + error.message);
      });
  }

  function renderAnalyticsStats(orders, users) {
    var paidOrders = (orders || []).filter(function (order) {
      return order.status !== "CANCELED";
    });
    var totalAmount = paidOrders.reduce(function (sum, order) {
      return sum + Number(order.payableAmount || 0);
    }, 0);
    var discountAmount = paidOrders.reduce(function (sum, order) {
      return sum + Number(order.discountAmount || 0);
    }, 0);
    var averageAmount = paidOrders.length ? totalAmount / paidOrders.length : 0;
    var orderCountByUser = {};
    paidOrders.forEach(function (order) {
      if (order.userId) {
        orderCountByUser[order.userId] = (orderCountByUser[order.userId] || 0) + 1;
      }
    });
    var activeUserCount = Object.keys(orderCountByUser).length || users.length || 1;
    var repeatUserCount = Object.keys(orderCountByUser).filter(function (userId) {
      return orderCountByUser[userId] > 1;
    }).length;
    var repeatRate = Math.round(repeatUserCount / activeUserCount * 100);
    var peakHour = peakOrderHour(paidOrders);
    var statCards = $all(".stat-card");
    setStatCard(statCards[0], "客单价", money(averageAmount), "按未取消订单计算");
    setStatCard(statCards[1], "复购率", repeatRate + "%", "有两笔及以上订单的用户占比");
    setStatCard(statCards[2], "优惠成本", money(discountAmount), "来自订单已抵扣金额");
    setStatCard(statCards[3], "高峰时段", peakHour, "按订单创建时间统计");
  }

  function peakOrderHour(orders) {
    if (!orders || !orders.length) {
      return "--";
    }
    var counts = {};
    orders.forEach(function (order) {
      var date = order.createdAt ? new Date(order.createdAt) : null;
      if (date && !isNaN(date.getTime())) {
        var hour = String(date.getHours()).padStart(2, "0") + ":00";
        counts[hour] = (counts[hour] || 0) + 1;
      }
    });
    return Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a];
    })[0] || "--";
  }

  function renderCategorySales(products, categories) {
    var chart = $(".analytics-category-bars") || $(".chart-bars");
    if (!chart) {
      return;
    }
    var categoryNameMap = {};
    categories.forEach(function (category) {
      categoryNameMap[category.id] = category.name;
    });
    var salesMap = {};
    (products || []).forEach(function (product) {
      var key = product.categoryId || "other";
      salesMap[key] = (salesMap[key] || 0) + Number(product.sales || 0);
    });
    var rows = Object.keys(salesMap).map(function (categoryId) {
      return {
        name: categoryNameMap[categoryId] || categoryId,
        sales: salesMap[categoryId]
      };
    }).sort(function (a, b) {
      return b.sales - a.sales;
    });
    var total = rows.reduce(function (sum, row) {
      return sum + row.sales;
    }, 0) || 1;
    chart.innerHTML = rows.map(function (row) {
      var percent = Math.round(row.sales / total * 100);
      return '<div class="bar-row"><span>' + escapeHtml(row.name) + '</span><div class="bar"><span style="width:' + Math.max(6, percent) + '%;"></span></div><strong>' + percent + '%</strong></div>';
    }).join("") || '<p class="muted">暂无商品销量数据。</p>';
  }

  function renderBusinessNotes(orders, products) {
    var noteCard = $(".content-grid .card:nth-child(2)");
    if (!noteCard) {
      return;
    }
    var hotProduct = (products || []).slice().sort(function (a, b) {
      return Number(b.sales || 0) - Number(a.sales || 0);
    })[0];
    var waitingCount = (orders || []).filter(function (order) {
      return order.status === "WAITING_PICKUP";
    }).length;
    var paragraphs = $all("p.muted", noteCard);
    if (paragraphs[0]) {
      paragraphs[0].textContent = waitingCount
        ? "当前还有 " + waitingCount + " 笔待取餐订单，建议优先处理订单管理页。"
        : "当前没有待取餐订单，订单处理压力较低。";
    }
    if (paragraphs[1]) {
      paragraphs[1].textContent = hotProduct
        ? hotProduct.name + " 当前销量最高，适合继续放在首页热门推荐位。"
        : "暂无商品销量数据，可先在商品管理中维护商品。";
    }
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
    initAdminUser();
    initDashboardPage();
    initProductsPage();
    initOrdersPage();
    initCategoriesPage();
    initCouponsPage();
    initActivitiesPage();
    initUsersPage();
    initAnalyticsPage();
  });
})();
