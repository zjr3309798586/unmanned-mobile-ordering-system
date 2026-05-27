# 云豹小点无人移动点餐系统

云豹小点无人移动点餐系统，当前仓库包含三部分：

- 前台用户端：手机点餐页面
- 后台管理端：管理员页面
- 后端 API：Java Spring Boot + MySQL + MyBatis

## 前台用户端

前台使用原生 HTML、CSS、JavaScript 实现，已接入 Spring Boot 后端接口。所有 H5
文件统一收纳在 `h5/` 子目录下,并由后端静态映射保持原 URL 不变(用户仍可访问
`http://127.0.0.1:8080/menu.html`)。

页面位于 `h5/pages/`:
- `h5/pages/index.html`：首页
- `h5/pages/menu.html`：点餐页
- `h5/pages/detail.html`：商品详情页
- `h5/pages/cart.html`：购物车 / 结算页(已合并提交订单)
- `h5/pages/order.html`：订单页
- `h5/pages/mine.html`：我的页
- `h5/pages/saving-card.html`：省钱卡页

公共资源:
- `h5/css/`：前台页面样式
- `h5/js/`：前台页面脚本
- `h5/images/`：图片资源(按用途分子目录)
    - `nav/`：底部导航图标
    - `home/`：首页 banner / mascot / 装饰
    - `menu/`：商品图(`menu-*.png` + `product-*.svg`)
    - `mine/`：我的页素材
    - `saving/`：省钱卡(吉祥物 + 自取/外卖图标)
    - `mascot/`：全局吉祥物
    - `common/`：占位图(food/avatar/banner-placeholder)

页面内引用统一使用绝对路径,例如 `<link href="/css/cart.css">`、
`<img src="/images/menu/menu-product-grape.png">`,由后端 8080 统一映射,
不依赖 html 文件所在物理位置。

## 微信小程序端

小程序端位于 `miniprogram/`，使用微信原生小程序语法，不使用 Vue、React。页面已接入当前 Spring Boot 后端，覆盖登录、点餐、购物车、提交订单、订单、我的和省钱卡流程。

页面包括：
- `pages/home/index`：首页
- `pages/menu/index`：点餐页
- `pages/detail/index`：商品详情页
- `pages/cart/index`：购物车 / 结算页(已合并提交订单)
- `pages/order/index`：订单页
- `pages/mine/index`：我的页
- `pages/saving-card/index`：省钱卡页

在微信开发者工具中打开：

```text
导入项目时选择 miniprogram 目录
AppID 可先使用测试号
后端保持运行：http://127.0.0.1:8080
```

小程序接口地址在 `miniprogram/utils/config.js`：

```js
apiBaseUrl: "http://127.0.0.1:8080/api"
```

开发者工具里可以直接用 `127.0.0.1` 调试。真机预览时不能继续用 `127.0.0.1`，需要改成本机局域网 IP 或部署后的 HTTPS 域名，并在微信后台配置合法域名。

当前小程序默认启用开发登录：

```js
useDevLogin: true
```

这样可以先完整跑通购物车和订单流程。正式微信登录时，把它改为 `false`，并配置后端环境变量 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`。

## 后台管理端

后台位于 `admin/`，同样使用原生 HTML、CSS、JavaScript 实现。数据看板、菜品管理、订单管理、分类、优惠券和用户页会读取后端接口。

当前已实现的真实联动：
- 后台菜品管理新增菜品后，前台点餐页会显示。
- 后台菜品管理下架菜品后，前台点餐页不再显示。
- 前台登录后加入购物车、提交订单，后台数据看板和订单管理会显示新订单。
- 后台订单管理完成或取消订单后，前台订单页状态会同步变化。
- 前台“我的”、购物车和订单页已按用户 token 读取数据，未登录不会显示个人资产和历史订单。

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

前台用户端当前提供 H5 调试登录，用于浏览器开发和联调。以后改成微信小程序时，使用小程序端 `wx.login()` 获取 `code`，再调用后端 `/api/auth/wechat-login`。需要先配置：

```powershell
$env:WECHAT_APP_ID="你的微信小程序AppID"
$env:WECHAT_APP_SECRET="你的微信小程序AppSecret"
```

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

## 项目结构总览

```
前台页面/                       项目根
├── h5/                        H5 前台用户端
│   ├── pages/                   7 个页面 html
│   │   ├── index.html
│   │   ├── menu.html
│   │   ├── detail.html
│   │   ├── cart.html
│   │   ├── order.html
│   │   ├── mine.html
│   │   └── saving-card.html
│   ├── css/                     8 个样式文件
│   ├── js/                      8 个脚本文件
│   └── images/                  图片资源(按用途分子目录)
│       ├── nav/                   底部导航图标
│       ├── home/                  首页 banner / mascot / 装饰
│       ├── menu/                  商品图(menu-*.png + product-*.svg)
│       ├── mine/                  我的页素材
│       ├── saving/                省钱卡素材 + 自取/外卖图标
│       ├── mascot/                全局吉祥物
│       └── common/                占位图(food/avatar/banner-placeholder)
├── admin/                     后台管理端(原生 HTML/CSS/JS)
│   ├── *.html                   9 个管理页面
│   ├── css/admin.css
│   └── js/admin.js
├── miniprogram/               微信小程序源码
│   ├── pages/                   7 个页面(home/menu/detail/cart/order/mine/saving-card)
│   ├── images/                  图片资源(同 h5/images 分子目录 + 自带 icons/ 子目录)
│   ├── utils/                   工具:api/auth/config/format
│   └── app.js / app.json / app.wxss
├── backend/                   后端 Spring Boot 服务
│   ├── src/main/java/com/unmanned/ordering/
│   │   ├── controller/          接收请求
│   │   ├── service/             业务逻辑
│   │   ├── mapper/              MyBatis 数据访问
│   │   ├── model/               实体
│   │   ├── request/             请求 DTO
│   │   ├── common/              工具类
│   │   ├── config/              配置(静态资源映射等)
│   │   └── exception/           全局异常处理
│   ├── src/main/resources/      MyBatis XML、application.yml
│   └── pom.xml
├── docs/                      项目文档
│   ├── 编码规范.md              ★ 项目代码规范(必读)
│   ├── 代码详解文档.md
│   ├── 后端完整代码精讲.md
│   ├── design-reference.md
│   └── …                        其他设计/截图/文档生成脚本
├── .gitignore
├── .editorconfig              ★ 编辑器格式约定
└── README.md
```

### 静态资源 URL 映射

后端 `FrontendResourceConfig` 与 `CorsConfig` 把 URL 与物理路径解耦,
开发者改动 H5 文件物理位置不影响访问 URL:

| URL 路径              | 物理位置          |
| --------------------- | ----------------- |
| `/`                   | forward 到 `/index.html` |
| `/X.html`             | `h5/pages/X.html` |
| `/css/**`             | `h5/css/**`       |
| `/js/**`              | `h5/js/**`        |
| `/images/**`          | `h5/images/**`    |
| `/admin/**`           | `admin/**`        |
| `/api/**`             | Spring 控制器     |

## 开发规范

本项目所有代码必须遵循 [`docs/编码规范.md`](docs/编码规范.md)。

该规范文档涵盖:

- 项目目录结构、命名约定
- HTML / CSS / JavaScript 编码风格
- 微信小程序与 Java 后端编码规范
- 接口设计、数据格式
- Git 分支与 Commit Message 规范
- 资源文件命名与压缩要求

### 编辑器配置

项目根目录已配置 `.editorconfig`,主流编辑器(VS Code / IDEA / WebStorm / Sublime / Vim 等)会自动加载,统一执行:

- UTF-8 编码
- LF 换行
- 2 空格缩进(Java / XML 为 4 空格)
- 行尾自动去除空格
- 文件末尾自动留空行

如使用 VS Code,建议安装 `EditorConfig for VS Code` 插件。

### Git 提交约定

提交信息遵循 Conventional Commits:

```
<type>(<scope>): <subject>
```

`type` 取值:`feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `chore`

示例:

```
feat(cart): 不可用优惠券置灰并显示"还差 ¥X"
fix(menu): 修复加号按钮在 iOS 无响应
docs: 补充编码规范文档
```
