# 无人移动点餐系统

无人移动点餐系统，当前仓库包含三部分：

- 前台用户端：手机点餐页面
- 后台管理端：管理员页面
- 后端 API：Java Spring Boot + MySQL + MyBatis

## 前台用户端

前台使用原生 HTML、CSS、JavaScript 实现，已接入 Spring Boot 后端接口。

页面包括：
- `index.html`：首页
- `menu.html`：点餐页
- `detail.html`：商品详情页
- `cart.html`：购物车页
- `submit-order.html`：提交订单页
- `order.html`：订单页
- `mine.html`：我的页
- `saving-card.html`：省钱卡页

公共资源：
- `css/`：前台页面样式
- `js/`：前台页面脚本
- `images/`：图片资源

## 后台管理端

后台位于 `admin/`，同样使用原生 HTML、CSS、JavaScript 实现。数据看板、菜品管理、订单管理、分类、优惠券和用户页会读取后端接口。

当前已实现的真实联动：
- 后台菜品管理新增菜品后，前台点餐页会显示。
- 后台菜品管理下架菜品后，前台点餐页不再显示。
- 前台提交订单后，后台数据看板和订单管理会显示新订单。
- 后台订单管理完成或取消订单后，前台订单页状态会同步变化。

页面包括：
- `admin/login.html`：管理员登录
- `admin/dashboard.html`：数据看板
- `admin/products.html`：菜品管理
- `admin/categories.html`：分类管理
- `admin/orders.html`：订单管理
- `admin/users.html`：用户管理
- `admin/coupons.html`：优惠券管理
- `admin/activities.html`：活动管理
- `admin/analytics.html`：统计分析

公共资源：
- `admin/css/admin.css`：后台公共样式
- `admin/js/admin.js`：后台公共脚本

## 后端 API

后端位于 `backend/`，使用 Java 11 + Spring Boot 2.7.18 + MySQL + MyBatis 实现。

先创建 MySQL 数据库：

```bash
cd backend
mysql -u root -p < database.sql
```

启动方式：

```bash
cd backend
mvn spring-boot:run
```

启动后访问：

```text
前台首页：http://127.0.0.1:8080/
后台登录：http://127.0.0.1:8080/admin/login.html
接口检查：http://127.0.0.1:8080/api/health
```

后台默认账号为 `admin`，默认密码为 `admin123`。正式使用前建议通过环境变量修改：

```powershell
$env:ADMIN_USERNAME="你的管理员账号"
$env:ADMIN_PASSWORD="你的管理员密码"
$env:ADMIN_TOKEN_SECRET="一段随机密钥"
```

当前已启用后台登录校验，未登录或 token 无效时不能访问 `/api/admin/**` 管理接口。

运行测试：

```bash
cd backend
mvn test
```

如果本机 Maven 报 `Non-parseable settings`，说明 Maven 安装目录下的 `settings.xml` 损坏，需要先修复 Maven 全局配置。

## 后端代码怎么理解

后端代码按简单的三层结构组织：

- `controller`：接收前端请求，比如商品列表、加入购物车、提交订单。
- `service`：写主要业务逻辑，比如计算购物车金额、创建订单、取消订单。
- `mapper`：使用 MyBatis 写 SQL，负责操作 MySQL 数据库。
- `model`：定义数据对象，比如商品、订单、用户、优惠券。
- `request`：定义前端提交的数据格式，比如加入购物车请求、提交订单请求。

主要数据表包括商品表、分类表、购物车表、订单表、订单明细表、优惠券表、用户信息表。

详细接口见：

```text
backend/README.md
```
