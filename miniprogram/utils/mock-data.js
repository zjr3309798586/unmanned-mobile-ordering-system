const products = [
  {
    id: "P-1004",
    categoryId: "tea",
    name: "云顶轻乳茶",
    description: "茉莉清香，轻盈顺滑",
    image: "/images/menu/product-milk-tea.svg",
    price: 15.8,
    sales: 628,
    tags: ["新品", "推荐"],
    enabled: true
  },
  {
    id: "P-1002",
    categoryId: "coffee",
    name: "海盐拿铁",
    description: "海盐奶盖，咸甜平衡",
    image: "/images/menu/product-coconut-latte.svg",
    price: 16.8,
    sales: 782,
    tags: ["热卖"],
    enabled: true
  },
  {
    id: "P-1001",
    categoryId: "coffee",
    name: "鲜橙美式",
    description: "鲜橙清香，清爽解腻",
    image: "/images/menu/product-orange-coffee.svg",
    price: 14.8,
    sales: 546,
    tags: ["果香咖啡"],
    enabled: true
  },
  {
    id: "P-1003",
    categoryId: "tea",
    name: "满杯西柚绿茶",
    description: "西柚果粒搭配绿茶茶底",
    image: "/images/menu/product-grapefruit-tea.svg",
    price: 13.9,
    sales: 520,
    tags: ["清爽"],
    enabled: true
  },
  {
    id: "P-1005",
    categoryId: "fruit",
    name: "葡萄冰萃",
    description: "葡萄鲜果，冰爽回甘",
    image: "/images/menu/menu-product-grape.png",
    price: 15.8,
    sales: 394,
    tags: ["新品"],
    enabled: true
  },
  {
    id: "P-1006",
    categoryId: "snack",
    name: "鸡肉能量卷",
    description: "高蛋白，轻盈饱腹",
    image: "/images/menu/menu-product-wrap.png",
    price: 13.8,
    sales: 318,
    tags: ["轻食"],
    enabled: true
  }
];

const categories = [
  { id: "tea", name: "招牌奶茶", sort: 1 },
  { id: "coffee", name: "精品咖啡", sort: 2 },
  { id: "fruit", name: "果茶气泡", sort: 3 },
  { id: "snack", name: "轻食小吃", sort: 4 },
  { id: "breakfast", name: "早餐专区", sort: 5 }
];

const coupons = [
  { id: "C-001", title: "饮品通用券", discountAmount: 6, minAmount: 20, conditionText: "满20元可用", available: true },
  { id: "C-002", title: "轻食通用券", discountAmount: 3, minAmount: 15, conditionText: "满15元可用", available: true },
  { id: "C-003", title: "咖啡专享券", discountAmount: 8, minAmount: 30, conditionText: "满30元可用", available: true },
  { id: "C-004", title: "省钱卡专属券", discountAmount: 5, minAmount: 25, conditionText: "满25元可用", available: true }
];

const addresses = [
  {
    id: "ADDR-MOCK-001",
    receiverName: "校园用户",
    phone: "13800000000",
    addressDetail: "3号宿舍楼 502",
    defaultAddress: true
  }
];

const cart = {
  items: [
    {
      id: "CI-001",
      productId: "P-1004",
      productName: "云顶轻乳茶",
      image: "/images/menu/product-milk-tea.svg",
      spec: "少冰 / 少糖 / 加珍珠",
      specText: "少冰 / 少糖 / 加珍珠",
      price: 15.8,
      quantity: 1,
      subtotal: 15.8,
      isNew: true
    },
    {
      id: "CI-002",
      productId: "P-1001",
      productName: "鲜橙美式",
      image: "/images/menu/product-orange-coffee.svg",
      spec: "标准冰 / 标准糖",
      specText: "标准冰 / 标准糖",
      price: 14.8,
      quantity: 1,
      subtotal: 14.8
    }
  ],
  totalQuantity: 2,
  totalAmount: 30.6
};

const orders = [
  {
    id: "O-MOCK-001",
    orderNo: "YB20260520001",
    storeName: "云豹小点·校园店",
    pickupType: "SELF_PICKUP",
    status: "WAITING_PICKUP",
    createdAt: "2026-05-20T10:32:00",
    pickupNo: "A102",
    payableAmount: 30.6,
    items: [
      { productId: "P-1004", productName: "云顶轻乳茶", image: "/images/menu/product-milk-tea.svg", quantity: 1 },
      { productId: "P-1001", productName: "鲜橙美式", image: "/images/menu/product-orange-coffee.svg", quantity: 1 }
    ]
  },
  {
    id: "O-MOCK-002",
    orderNo: "YB20260519002",
    storeName: "云豹小点·校园店",
    pickupType: "DELIVERY",
    status: "DELIVERING",
    createdAt: "2026-05-19T14:15:00",
    pickupNo: "B037",
    deliveryAddress: "3号宿舍楼 502",
    deliveryContact: "游客用户",
    deliveryFee: 3,
    payableAmount: 43.4,
    items: [
      { productId: "P-1002", productName: "海盐拿铁", image: "/images/menu/product-coconut-latte.svg", quantity: 1 },
      { productId: "P-1006", productName: "鸡肉能量卷", image: "/images/menu/menu-product-wrap.png", quantity: 1 }
    ]
  }
];

const tickets = [
  {
    id: "T-MOCK-001",
    type: "PICKUP_ISSUE",
    status: "REPLIED",
    orderNo: "YB20260520001",
    content: "想确认一下取餐进度",
    replyContent: "您好，当前订单已制作完成，请凭取餐号 A102 到门店取餐。",
    createdAt: "2026-05-20T10:36:00",
    repliedAt: "2026-05-20T10:38:00"
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

let mockCart = clone(cart);
let mockOrders = clone(orders);
let mockAddresses = clone(addresses);
let mockTickets = clone(tickets);
let mockFavoriteIds = ["P-1004", "P-1002"];
let mockSavingCardOpened = false;
let mockUserCouponStatus = {};

function pathname(path) {
  return String(path || "").split("?")[0];
}

function productByPath(path) {
  const id = decodeURIComponent(pathname(path).replace("/products/", ""));
  return products.find((item) => item.id === id) || products[0];
}

function productById(id) {
  return products.find((item) => String(item.id) === String(id)) || null;
}

function normalizeCart() {
  mockCart.items = (mockCart.items || []).map((item) => {
    const quantity = Math.max(Number(item.quantity || 1), 1);
    const price = Number(item.price || 0);
    return {
      ...item,
      quantity,
      subtotal: Number((price * quantity).toFixed(1))
    };
  });
  mockCart.totalQuantity = mockCart.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  mockCart.totalAmount = Number(mockCart.items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0).toFixed(1));
  return mockCart;
}

function addCartItem(data) {
  const product = productById(data && data.productId);
  if (!product) return normalizeCart();
  const spec = (data && data.spec) || "标准杯";
  const quantity = Math.max(Number((data && data.quantity) || 1), 1);
  const existing = mockCart.items.find((item) => item.productId === product.id && String(item.specText || item.spec || "") === String(spec));
  if (existing) {
    existing.quantity = Number(existing.quantity || 0) + quantity;
    return normalizeCart();
  }
  mockCart.items.push({
    id: "CI-MOCK-" + Date.now() + "-" + mockCart.items.length,
    productId: product.id,
    productName: product.name,
    image: product.image,
    spec,
    specText: spec,
    price: Number(product.price || 0),
    quantity,
    subtotal: Number((Number(product.price || 0) * quantity).toFixed(1)),
    isNew: product.tags && product.tags.indexOf("新品") >= 0
  });
  return normalizeCart();
}

function updateCartItem(id, data) {
  const item = mockCart.items.find((entry) => String(entry.id) === String(id));
  if (!item) return normalizeCart();
  const quantity = Number(data && data.quantity);
  if (!quantity || quantity <= 0) {
    mockCart.items = mockCart.items.filter((entry) => String(entry.id) !== String(id));
  } else {
    item.quantity = quantity;
  }
  return normalizeCart();
}

function removeCartItem(id) {
  mockCart.items = mockCart.items.filter((entry) => String(entry.id) !== String(id));
  return normalizeCart();
}

function clearCart() {
  mockCart = { items: [], totalQuantity: 0, totalAmount: 0 };
  return mockCart;
}

function queueStats() {
  const makingOrders = mockOrders.filter((order) => order.status === "MAKING");
  return {
    queueOrderCount: makingOrders.length,
    queueCupCount: makingOrders.reduce((sum, order) => {
      return sum + (order.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 1), 0);
    }, 0)
  };
}

function createOrder(data) {
  const currentCart = normalizeCart();
  if (!currentCart.items.length) {
    return undefined;
  }
  const pickupType = (data && data.pickupType) || "SELF_PICKUP";
  const selectedCoupon = coupons.find((coupon) => String(coupon.id) === String(data && data.couponId));
  const canUseCoupon = selectedCoupon
    && mockUserCouponStatus[selectedCoupon.id] === "AVAILABLE"
    && currentCart.totalAmount >= Number(selectedCoupon.minAmount || 0);
  const discount = canUseCoupon ? Number(selectedCoupon.discountAmount || 0) : 0;
  const deliveryFee = pickupType === "DELIVERY" ? 3 : 0;
  const payableAmount = Math.max(currentCart.totalAmount - discount + deliveryFee, 0);
  const now = new Date();
  const order = {
    id: "O-MOCK-" + now.getTime(),
    orderNo: "YB" + now.getTime(),
    storeName: "云豹小点·校园店",
    pickupType,
    status: "MAKING",
    createdAt: now.toISOString(),
    pickupNo: "A" + String(Math.floor(Math.random() * 900) + 100),
    deliveryAddress: (data && data.deliveryAddress) || "",
    deliveryContact: (data && data.deliveryContact) || "",
    deliveryFee,
    discountAmount: Number(discount.toFixed(1)),
    couponId: canUseCoupon ? selectedCoupon.id : "",
    payableAmount: Number(payableAmount.toFixed(1)),
    items: currentCart.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      image: item.image,
      quantity: item.quantity,
      price: item.price,
      specText: item.specText || item.spec || "标准杯"
    }))
  };
  mockOrders.unshift(order);
  if (canUseCoupon) {
    mockUserCouponStatus[selectedCoupon.id] = "USED";
  }
  clearCart();
  return order;
}

function repeatOrder(id) {
  const order = mockOrders.find((item) => String(item.id) === String(id));
  if (!order) return normalizeCart();
  (order.items || []).forEach((item) => {
    addCartItem({
      productId: item.productId,
      spec: item.specText || "标准杯",
      quantity: item.quantity || 1
    });
  });
  return normalizeCart();
}

function favoriteIdFromRoute(route) {
  return decodeURIComponent(route.replace("/favorites/", "").replace("/status", ""));
}

function saveAddress(data, id) {
  const next = {
    id: id || ("ADDR-MOCK-" + Date.now()),
    receiverName: (data && data.receiverName) || "校园用户",
    phone: (data && data.phone) || "13800000000",
    addressDetail: (data && data.addressDetail) || "3号宿舍楼 502",
    defaultAddress: !!(data && data.defaultAddress)
  };
  if (next.defaultAddress) {
    mockAddresses = mockAddresses.map((item) => ({ ...item, defaultAddress: false }));
  }
  const index = mockAddresses.findIndex((item) => String(item.id) === String(next.id));
  if (index >= 0) mockAddresses[index] = { ...mockAddresses[index], ...next };
  else mockAddresses.push(next);
  return next;
}

function couponSuggestions(path) {
  const query = String(path || "").split("?")[1] || "";
  const match = query.match(/amount=([^&]+)/);
  const total = match ? Number(decodeURIComponent(match[1])) : 0;
  return coupons.map((coupon) => {
    const usable = total >= Number(coupon.minAmount || 0);
    return {
      coupon,
      usable,
      gapAmount: usable ? 0 : Math.max(Number(coupon.minAmount || 0) - total, 0),
      reason: usable ? "当前金额可用" : "还差" + Math.max(Number(coupon.minAmount || 0) - total, 0).toFixed(1) + "元可用"
    };
  });
}

function get(path) {
  const route = pathname(path);
  if (route === "/store") {
    const stats = queueStats();
    return {
      id: "STORE-001",
      name: "云豹小点·校园店",
      address: "海光路100号校园生活中心1楼",
      distance: "520m",
      businessHours: "08:00 - 22:30",
      notice: "夏日新品已上线，冰爽果茶系列限时优惠中",
      queueCupCount: stats.queueCupCount,
      queueOrderCount: stats.queueOrderCount
    };
  }
  if (route === "/banners") {
    return [
      { id: "B-001", title: "轻松点一杯", subtitle: "新客专享券包", image: "/images/home/home-banner-1.png", linkUrl: "/pages/menu/index" },
      { id: "B-002", title: "咖啡提神", subtitle: "校园午后能量补给", image: "/images/home/home-banner-2.png", linkUrl: "/pages/menu/index" },
      { id: "B-003", title: "轻食搭配", subtitle: "饮品小食更划算", image: "/images/home/home-banner-3.png", linkUrl: "/pages/menu/index" }
    ];
  }
  if (route === "/categories") return categories;
  if (route === "/products") return products;
  if (route.indexOf("/products/") === 0) return productByPath(route);
  if (route === "/smart/recommendations") {
    return products.slice(0, 6).map((product) => ({ product, reason: product.tags && product.tags[0] ? product.tags[0] : "人气推荐" }));
  }
  if (route === "/smart/coupons") return couponSuggestions(path);
  if (route === "/saving-card/plans") {
    return [{ id: "S-001", name: "月卡权益 · 校园专享", price: 18, originalPrice: 28, saveAmount: 48 }];
  }
  if (route === "/coupons") return coupons;
  if (route === "/user/coupons") {
    return coupons
      .filter((coupon) => mockUserCouponStatus[coupon.id])
      .map((coupon) => ({ ...coupon, couponId: coupon.id, status: mockUserCouponStatus[coupon.id] }));
  }
  if (route === "/user/addresses") return mockAddresses;
  if (route === "/cart") return normalizeCart();
  if (route === "/orders") return mockOrders;
  if (route === "/mine") {
    return {
      nickname: "游客用户",
      memberLevel: mockSavingCardOpened ? "省钱卡会员" : "普通会员",
      balance: 24.5,
      couponCount: Object.keys(mockUserCouponStatus).filter((id) => mockUserCouponStatus[id] === "AVAILABLE").length,
      savingAmount: mockSavingCardOpened ? 12 : 0
    };
  }
  if (route === "/support-tickets") return mockTickets;
  if (route === "/favorites") return products.filter((product) => mockFavoriteIds.indexOf(product.id) >= 0);
  if (route.indexOf("/favorites/") === 0 && route.indexOf("/status") > 0) {
    const id = favoriteIdFromRoute(route);
    const active = mockFavoriteIds.indexOf(id) >= 0;
    return { favorite: active, favorited: active };
  }
  return undefined;
}

function post(path, data) {
  const route = pathname(path);
  if (route === "/auth/dev-login") {
    return {
      token: "mock-dev-token",
      nickname: (data && data.nickname) || "游客用户",
      userId: "U-MOCK-001"
    };
  }
  if (route === "/smart/support-reply") {
    return {
      type: (data && data.type) || "OTHER",
      reply: "我先帮你判断问题类型。若涉及订单处理、退款或补做，可以继续转人工让门店员工跟进。"
    };
  }
  if (route === "/support-tickets") {
    const ticket = {
      id: "T-MOCK-" + Date.now(),
      status: "PENDING",
      type: (data && data.type) || "OTHER",
      orderNo: (data && data.orderNo) || "",
      content: (data && data.content) || "",
      createdAt: new Date().toISOString()
    };
    mockTickets.unshift(ticket);
    return ticket;
  }
  if (route === "/cart/items") return addCartItem(data || {});
  if (route === "/orders") return createOrder(data || {});
  if (/^\/orders\/.+\/repeat$/.test(route)) return repeatOrder(route.split("/")[2]);
  if (/^\/favorites\/.+/.test(route)) {
    const id = favoriteIdFromRoute(route);
    if (mockFavoriteIds.indexOf(id) < 0) mockFavoriteIds.push(id);
    return { favorite: true, favorited: true };
  }
  if (route === "/saving-card/open") {
    mockSavingCardOpened = true;
    return { opened: true };
  }
  if (/^\/user\/coupons\/.+\/claim$/.test(route)) {
    const couponId = route.split("/")[3];
    if (!mockSavingCardOpened) return undefined;
    mockUserCouponStatus[couponId] = "AVAILABLE";
    return { claimed: true, couponId, status: "AVAILABLE" };
  }
  if (route === "/user/addresses") {
    return saveAddress(data || null);
  }
  if (/^\/user\/addresses\/.+/.test(route)) {
    return saveAddress(data || null, route.split("/")[3]);
  }
  return undefined;
}

function patch(path, data) {
  const route = pathname(path);
  if (/^\/cart\/items\/.+/.test(route)) return updateCartItem(route.split("/")[3], data || {});
  if (/^\/user\/addresses\/.+\/default$/.test(route)) {
    const id = route.split("/")[3];
    mockAddresses = mockAddresses.map((item) => ({ ...item, defaultAddress: String(item.id) === String(id) }));
    return mockAddresses.find((item) => String(item.id) === String(id)) || null;
  }
  return post(path, data);
}

function put(path, data) {
  const route = pathname(path);
  if (/^\/user\/addresses\/.+/.test(route)) return saveAddress(data || null, route.split("/")[3]);
  return post(path, data);
}

function del(path) {
  const route = pathname(path);
  if (route === "/cart") return clearCart();
  if (/^\/cart\/items\/.+/.test(route)) return removeCartItem(route.split("/")[3]);
  if (/^\/favorites\/.+/.test(route)) {
    const id = favoriteIdFromRoute(route);
    mockFavoriteIds = mockFavoriteIds.filter((item) => String(item) !== String(id));
    return { favorite: false, favorited: false };
  }
  if (/^\/user\/addresses\/.+/.test(route)) {
    const id = route.split("/")[3];
    mockAddresses = mockAddresses.filter((item) => String(item.id) !== String(id));
    return { deleted: true };
  }
  return undefined;
}

function fallback(path, method, data) {
  const upper = String(method || "GET").toUpperCase();
  const handlers = {
    GET: get,
    POST: post,
    PUT: put,
    PATCH: patch,
    DELETE: del
  };
  const handler = handlers[upper];
  const value = handler ? handler(path, data) : undefined;
  return value === undefined ? undefined : clone(value);
}

module.exports = {
  fallback
};
