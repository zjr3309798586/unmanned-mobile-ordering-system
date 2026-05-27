# 后端 API 说明

本目录是“云豹小点无人移动点餐系统”的后端 API，技术栈为 Java 11 + Spring Boot 2.7.18 + MySQL + MyBatis。

## 先理解代码结构

代码按简单的分层方式组织：

```text
src/main/java/com/unmanned/ordering
├── controller   接口层，接收浏览器请求
├── service      业务层，处理购物车、订单、商品管理逻辑
├── mapper       数据访问层，用 MyBatis 写 SQL 操作数据库
├── model        数据对象，表示商品、订单、用户等
├── request      请求对象，表示前端提交的数据
├── common       统一响应格式
├── config       跨域、类型转换等配置
└── exception    异常处理
```

一次下单流程可以这样讲：

1. 前端请求 `POST /api/cart/items`。
2. `CartController` 校验 `X-User-Token`，确认当前登录用户。
3. `OrderingService` 处理业务逻辑。
4. `CartMapper` 执行 SQL，把商品保存到当前用户的 `cart_items` 表记录。
5. 提交订单时，后端从当前用户的 `cart_items` 读取数据，写入 `orders` 和 `order_items` 表。

## 数据库

数据库使用 MySQL。先创建数据库：

```bash
mysql -u root -p < database.sql
```

如果你在 `backend/` 目录外执行，需要写完整路径：

```bash
mysql -u root -p < backend/database.sql
```

`database.sql` 只负责创建数据库：

```text
unmanned_ordering
```

项目启动时会自动创建数据表并插入初始数据，SQL 文件在：

```text
src/main/resources/db/schema-mysql.sql
src/main/resources/db/data-mysql.sql
```

主要数据表：

- `stores`：门店信息
- `categories`：商品分类
- `products`：商品信息
- `coupons`：优惠券
- `saving_card_plans`：省钱卡方案
- `users`：用户登录会话
- `user_profiles`：用户信息
- `cart_items`：购物车
- `orders`：订单主表
- `order_items`：订单商品明细

## 配置数据库账号

默认配置在 `src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/unmanned_ordering?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
```

如果你的 MySQL 密码不是 `123456`，推荐用环境变量启动，不要反复改代码：

```powershell
$env:DB_PASSWORD="你的MySQL密码"
mvn spring-boot:run
```

如果用户名也不是 `root`：

```powershell
$env:DB_USERNAME="你的用户名"
$env:DB_PASSWORD="你的密码"
mvn spring-boot:run
```

## 启动后端

```bash
mvn spring-boot:run
```

默认访问地址：

```text
http://127.0.0.1:8080
```

健康检查：

```text
GET /api/health
```

## 前台接口

用户登录：

```text
POST   /api/auth/dev-login       H5 浏览器联调用
POST   /api/auth/wechat-login    微信小程序登录用
GET    /api/auth/me
POST   /api/auth/logout
```

需要用户身份的接口要带请求头：

```text
X-User-Token: 登录接口返回的 token
```

微信小程序登录流程：

```text
1. 小程序端调用 wx.login() 拿到 code。
2. 小程序端把 code 传给 POST /api/auth/wechat-login。
3. 后端用 WECHAT_APP_ID 和 WECHAT_APP_SECRET 调微信接口换 openid。
4. 后端创建或更新用户，返回 token。
5. 后续购物车、订单、我的页接口都带 X-User-Token。
```

当前仓库已提供微信小程序端，目录是：

```text
../miniprogram
```

开发者工具联调时，小程序默认通过 `POST /api/auth/dev-login` 获取用户 token。正式接微信登录时，再把 `miniprogram/utils/config.js` 里的 `useDevLogin` 改为 `false`。

基础数据：

```text
GET    /api/store
GET    /api/categories
GET    /api/products?categoryId=coffee&keyword=latte
GET    /api/products/{productId}
GET    /api/coupons
GET    /api/saving-card/plans
GET    /api/mine
```

购物车：

```text
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/{itemId}
DELETE /api/cart/items/{itemId}
DELETE /api/cart
```

加入购物车请求示例：

```json
{
  "productId": "P-1001",
  "spec": "标准杯 / 常温 / 正常糖",
  "quantity": 2
}
```

订单：

```text
GET    /api/orders
GET    /api/orders?status=WAITING_PICKUP
GET    /api/orders/{orderId}
POST   /api/orders
PATCH  /api/orders/{orderId}/cancel
POST   /api/orders/{orderId}/repeat
```

提交订单请求示例：

```json
{
  "pickupType": "SELF_PICKUP",
  "couponId": "C-001",
  "tableNo": "A12",
  "remark": "少冰"
}
```

## 后台接口

```text
GET    /api/admin/dashboard
GET    /api/admin/products
POST   /api/admin/products
PATCH  /api/admin/products/{productId}
DELETE /api/admin/products/{productId}
GET    /api/admin/orders
PATCH  /api/admin/orders/{orderId}/complete
PATCH  /api/admin/orders/{orderId}/cancel
GET    /api/admin/users
```

新增或修改商品请求示例：

```json
{
  "categoryId": "coffee",
  "name": "Vanilla Latte",
  "description": "A light coffee drink with vanilla aroma.",
  "image": "/images/menu/product-vanilla-latte.svg",
  "price": 16.9,
  "sales": 0,
  "tags": ["New"],
  "enabled": true
}
```

`image` 字段填前端静态资源的 URL 路径。前台图片已按用途分子目录：

```text
/images/nav/      底部导航图标
/images/home/     首页 banner / 装饰
/images/menu/     商品图(menu-*.png + product-*.svg)
/images/mine/     我的页素材
/images/saving/   省钱卡素材 + 自取/外卖图标
/images/mascot/   全局吉祥物
/images/common/   占位图
```

为兼容历史数据,旧的扁平路径(例如 `/images/product-vanilla-latte.svg`)
仍然可用——前端的 `assetUrl` / `imageUrl` 会按文件名前缀自动重写到子目录。

## 统一响应格式

```json
{
  "success": true,
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 测试

```bash
mvn test
```

测试使用 H2 临时数据库，不需要连接本机 MySQL。

当前测试覆盖：

- 健康检查
- 商品列表
- 用户登录
- 加入购物车
- 提交订单
- 后台鉴权
