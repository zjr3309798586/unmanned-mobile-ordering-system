const path = require("path");
const fs = require("fs");

const { chromium } = require("playwright");

const outDir = path.resolve(__dirname, "actual-page-screenshots");
fs.mkdirSync(outDir, { recursive: true });

const baseUrl = "http://127.0.0.1:8080";
const localBrowser = fs.existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  : "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function api(pathname, options = {}) {
  const response = await fetch(baseUrl + "/api" + pathname, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "API failed: " + pathname);
  }
  return payload.data;
}

async function waitForPage(page) {
  await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

async function mobileShot(browser, file, url, token) {
  const context = await browser.newContext({ viewport: { width: 430, height: 920 }, deviceScaleFactor: 1 });
  if (token) {
    await context.addInitScript((value) => {
      localStorage.setItem("orderingUserToken", value.token);
      localStorage.setItem("orderingUserSession", JSON.stringify(value.session));
    }, token);
  }
  const page = await context.newPage();
  await page.goto(baseUrl + "/" + url, { waitUntil: "domcontentloaded" });
  await waitForPage(page);
  await page.screenshot({ path: path.join(outDir, file), fullPage: false });
  await context.close();
}

async function desktopShot(browser, file, url, adminSession) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 820 }, deviceScaleFactor: 1 });
  if (adminSession) {
    await context.addInitScript((session) => {
      localStorage.setItem("umo-admin-token", session.token);
      localStorage.setItem("umo-admin-username", session.username);
    }, adminSession);
  }
  const page = await context.newPage();
  await page.goto(baseUrl + "/" + url, { waitUntil: "domcontentloaded" });
  await waitForPage(page);
  await page.screenshot({ path: path.join(outDir, file), fullPage: false });
  await context.close();
}

(async () => {
  const session = await api("/auth/dev-login", {
    method: "POST",
    body: JSON.stringify({ nickname: "游客用户" }),
  });
  const token = { token: session.token, session };
  const products = await api("/products");
  const firstProduct = products[0];
  const secondProduct = products[1] || products[0];

  await api("/cart", { method: "DELETE", headers: { "X-User-Token": session.token } }).catch(() => {});
  await api("/cart/items", {
    method: "POST",
    headers: { "X-User-Token": session.token },
    body: JSON.stringify({ productId: firstProduct.id, spec: "标准杯 / 常温 / 正常糖", quantity: 1 }),
  });
  if (secondProduct && secondProduct.id !== firstProduct.id) {
    await api("/cart/items", {
      method: "POST",
      headers: { "X-User-Token": session.token },
      body: JSON.stringify({ productId: secondProduct.id, spec: "大杯 / 少冰 / 半糖", quantity: 1 }),
    });
  }

  const adminSession = await api("/admin/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });

  const browser = await chromium.launch({ headless: true, executablePath: localBrowser });

  await mobileShot(browser, "01-home.png", "index.html", token);
  await mobileShot(browser, "02-menu.png", "menu.html", token);
  await mobileShot(browser, "03-detail.png", "detail.html?id=" + encodeURIComponent(firstProduct.id), token);
  await mobileShot(browser, "04-cart.png", "cart.html", token);
  await mobileShot(browser, "05-submit-order.png", "submit-order.html", token);
  await mobileShot(browser, "06-mine-login.png", "mine.html", null);
  await mobileShot(browser, "07-mine-user.png", "mine.html", token);
  await mobileShot(browser, "08-saving-card.png", "saving-card.html", token);
  await desktopShot(browser, "09-admin-login.png", "admin/login.html", null);
  await desktopShot(browser, "10-admin-dashboard.png", "admin/dashboard.html", adminSession);
  await desktopShot(browser, "11-admin-products.png", "admin/products.html", adminSession);

  await api("/orders", {
    method: "POST",
    headers: { "X-User-Token": session.token },
    body: JSON.stringify({ pickupType: "SELF_PICKUP", tableNo: "A12", remark: "少冰" }),
  }).catch(() => {});
  await mobileShot(browser, "12-order.png", "order.html", token);

  await browser.close();
  console.log(outDir);
})();
