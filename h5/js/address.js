document.addEventListener("DOMContentLoaded", function () {
  var app = window.OrderingApp;
  var listNode = document.querySelector("[data-address-list]");
  var drawer = document.querySelector("[data-address-drawer]");
  var mask = document.querySelector("[data-address-mask]");
  var form = document.querySelector("[data-address-form]");
  var title = document.querySelector("[data-drawer-title]");
  var selectMode = app && app.queryParam && app.queryParam("select") === "1";
  var editingId = "";
  var addresses = [];

  function escape(value) {
    return app && app.escapeHtml ? app.escapeHtml(value) : String(value || "");
  }

  function showDrawer(address) {
    editingId = address ? address.id : "";
    if (title) title.textContent = editingId ? "编辑收货地址" : "新增收货地址";
    if (form) {
      form.receiverName.value = address ? address.receiverName || "" : "";
      form.phone.value = address ? address.phone || "" : "";
      form.addressDetail.value = address ? address.addressDetail || "" : "";
      form.defaultAddress.checked = address ? !!address.defaultAddress : addresses.length === 0;
    }
    if (drawer) drawer.hidden = false;
    if (mask) mask.hidden = false;
  }

  function closeDrawer() {
    if (drawer) drawer.hidden = true;
    if (mask) mask.hidden = true;
  }

  function saveSelected(address) {
    localStorage.setItem("deliveryAddressId", address.id);
    localStorage.setItem("deliveryAddress", address.addressDetail || "");
    localStorage.setItem("deliveryContact", (address.receiverName || "") + " " + (address.phone || ""));
    if (app && app.showMessage) app.showMessage("已选择配送地址");
    window.setTimeout(function () {
      window.location.href = "cart.html";
    }, 350);
  }

  function render() {
    if (!listNode) return;
    if (!addresses.length) {
      listNode.innerHTML = '<div class="address-empty">还没有收货地址<br>新增后外送下单会自动带出</div>';
      return;
    }
    listNode.innerHTML = addresses.map(function (item) {
      return '<article class="address-card ' + (item.defaultAddress ? 'is-default' : '') + '" data-address-id="' + escape(item.id) + '">'
        + '<div class="address-card-head">'
        +   '<strong class="address-name">' + escape(item.receiverName) + '</strong>'
        +   '<span class="address-phone">' + escape(item.phone) + '</span>'
        +   (item.defaultAddress ? '<span class="address-tag">默认</span>' : '')
        + '</div>'
        + '<p class="address-detail">' + escape(item.addressDetail) + '</p>'
        + '<div class="address-actions">'
        +   (selectMode ? '<button class="is-primary" type="button" data-pick-address="' + escape(item.id) + '">使用这个地址</button>' : '')
        +   (!item.defaultAddress ? '<button type="button" data-default-address="' + escape(item.id) + '">设为默认</button>' : '')
        +   '<button type="button" data-edit-address="' + escape(item.id) + '">编辑</button>'
        +   '<button class="is-danger" type="button" data-delete-address="' + escape(item.id) + '">删除</button>'
        + '</div>'
      + '</article>';
    }).join("");
  }

  function load() {
    if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
      if (listNode) listNode.innerHTML = '<div class="address-empty">请先登录后管理收货地址</div>';
      return;
    }
    app.get("/user/addresses")
      .then(function (data) {
        addresses = Array.isArray(data) ? data : [];
        render();
      })
      .catch(function (error) {
        if (listNode) listNode.innerHTML = '<div class="address-empty">' + escape(error.message) + '</div>';
      });
  }

  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-add-address]")) {
      event.preventDefault();
      if (!app || !app.isLoggedIn || !app.isLoggedIn()) {
        if (app && app.showMessage) app.showMessage("请先登录后管理地址");
        return;
      }
      showDrawer(null);
      return;
    }
    if (event.target.closest("[data-close-drawer]") || event.target.closest("[data-address-mask]")) {
      event.preventDefault();
      closeDrawer();
      return;
    }
    var edit = event.target.closest("[data-edit-address]");
    if (edit) {
      event.preventDefault();
      showDrawer(addresses.find(function (item) { return item.id === edit.dataset.editAddress; }));
      return;
    }
    var setDefault = event.target.closest("[data-default-address]");
    if (setDefault) {
      event.preventDefault();
      app.patch("/user/addresses/" + encodeURIComponent(setDefault.dataset.defaultAddress) + "/default", {})
        .then(load)
        .catch(function (error) { app.showMessage(error.message); });
      return;
    }
    var del = event.target.closest("[data-delete-address]");
    if (del) {
      event.preventDefault();
      if (!window.confirm("确定删除这个地址吗？")) return;
      app.del("/user/addresses/" + encodeURIComponent(del.dataset.deleteAddress))
        .then(load)
        .catch(function (error) { app.showMessage(error.message); });
      return;
    }
    var pick = event.target.closest("[data-pick-address]");
    if (pick) {
      event.preventDefault();
      var address = addresses.find(function (item) { return item.id === pick.dataset.pickAddress; });
      if (address) saveSelected(address);
    }
  });

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var body = {
        receiverName: form.receiverName.value.trim(),
        phone: form.phone.value.trim(),
        addressDetail: form.addressDetail.value.trim(),
        defaultAddress: form.defaultAddress.checked
      };
      var request = editingId
        ? app.put("/user/addresses/" + encodeURIComponent(editingId), body)
        : app.post("/user/addresses", body);
      request.then(function () {
        closeDrawer();
        load();
        if (app && app.showMessage) app.showMessage("地址已保存");
      }).catch(function (error) {
        if (app && app.showMessage) app.showMessage(error.message);
      });
    });
  }

  load();
});
