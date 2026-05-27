# 云豹小点 SQL 学习教程

> 这份文档**用本项目里真实的 SQL 当例子**讲 SQL,不是抽象的语法书。
> 看完之后,你能完整理解 `backend/src/main/java/.../mapper/` 里每条 SQL 在做什么。

---

## 目录

1. [数据库总览](#1-数据库总览)
2. [12 张表逐表详解](#2-12-张表逐表详解)
3. [SQL 基础(从你项目最简单的 SQL 开始)](#3-sql-基础)
4. [WHERE 条件筛选](#4-where-条件筛选)
5. [JOIN 多表关联](#5-join-多表关联)
6. [ORDER BY 排序与 LIMIT](#6-order-by-排序与-limit)
7. [动态 SQL(MyBatis 的 `<if>` `<where>`)](#7-动态-sql)
8. [INSERT 插入](#8-insert-插入)
9. [UPDATE 修改 + 防御性写法](#9-update-修改--防御性写法)
10. [DELETE 删除 vs 软删除](#10-delete-删除-vs-软删除)
11. [聚合函数(COUNT / SUM / AVG)](#11-聚合函数)
12. [状态机 SQL(优惠券 / 订单的"领-用-取消"流程)](#12-状态机-sql)
13. [常见踩坑点](#13-常见踩坑点)

---

## 1. 数据库总览

本项目数据库名:`unmanned_ordering`,引擎 InnoDB,字符集 utf8mb4。

**12 张表分 5 大类:**

```
门店运营层(后台维护,前台只读)
  ├── stores              门店信息
  ├── banners             首页轮播图
  ├── categories          商品分类
  ├── coupons             优惠券规则
  ├── saving_card_plans   省钱卡套餐
  └── products            商品(关联 categories)

用户层
  ├── users               登录会话(openid / token / 昵称)
  └── user_profiles       会员资料(等级 / 积分 / 节省金额)

业务流水层
  ├── cart_items          购物车(关联 users + products)
  ├── orders              订单主表(关联 users)
  ├── order_items         订单明细(关联 orders)
  └── user_coupons        用户优惠券(关联 users + coupons)
```

**表与表之间用 `XXX_id` 字段关联**(本项目没用外键约束,靠代码逻辑保证)。

例如:
- `products.category_id` 指向 `categories.id`
- `cart_items.user_id` 指向 `users.id`
- `cart_items.product_id` 指向 `products.id`
- `order_items.order_id` 指向 `orders.id`

---

## 2. 12 张表逐表详解

### 2.1 stores —— 门店

```sql
CREATE TABLE stores (
  id              VARCHAR(32) PRIMARY KEY,    -- 门店 ID(主键)
  name            VARCHAR(100) NOT NULL,      -- 门店名
  address         VARCHAR(200) NOT NULL,      -- 地址
  distance        VARCHAR(30)  NOT NULL,      -- 距离(展示用,如 "1.10km")
  business_hours  VARCHAR(50)  NOT NULL,      -- 营业时间
  notice          VARCHAR(500) NOT NULL       -- 公告
);
```

**为什么 distance 是字符串而不是数字?** 因为它是给用户看的展示字段(带单位 "km"),不需要计算。如果以后要做"按距离排序",会单独存数字。

### 2.2 categories —— 商品分类

```sql
CREATE TABLE categories (
  id          VARCHAR(32) PRIMARY KEY,
  name        VARCHAR(60) NOT NULL,
  sort_order  INT         NOT NULL    -- 排序权重,数值小的排前面
);
```

为什么是 `sort_order` 而不是 `order`?因为 **`order` 是 SQL 关键字**(用于 `ORDER BY`),用作字段名会和语法冲突。这是命名时要避开的关键字之一。

### 2.3 products —— 商品

```sql
CREATE TABLE products (
  id           VARCHAR(32)  PRIMARY KEY,
  category_id  VARCHAR(32)  NOT NULL,                -- 所属分类(外键,无约束)
  name         VARCHAR(100) NOT NULL,                -- 商品名
  description  VARCHAR(500) NOT NULL,                -- 描述
  image        VARCHAR(200) NOT NULL,                -- 图片路径
  price        DECIMAL(10,2) NOT NULL,               -- 单价(精确到分)
  sales        INT          NOT NULL DEFAULT 0,      -- 销量
  tags         VARCHAR(200) NOT NULL DEFAULT '',     -- 标签(逗号分隔)
  enabled      TINYINT(1)   NOT NULL DEFAULT 1,      -- 是否上架(1/0)
  INDEX idx_products_category (category_id)          -- 按分类查询的索引
);
```

**几个关键点:**

1. **`price DECIMAL(10,2)`** —— 金额绝不要用 `FLOAT/DOUBLE`(浮点精度问题会让 `0.1 + 0.2 = 0.30000000001`)。`DECIMAL(10,2)` 表示总共 10 位数字,小数部分 2 位,所以最大值是 `99999999.99`。
2. **`tags VARCHAR`** —— 没用 JSON 列,而是逗号分隔字符串(`"新品,推荐"`)。读取时通过 `StringListTypeHandler` 转 `List<String>`。简单粗暴但能用。
3. **`enabled TINYINT(1)`** —— MySQL 没有真正的 BOOLEAN,用 `TINYINT(1)` 模拟,1 表示 true,0 表示 false。
4. **`INDEX idx_products_category`** —— 因为前台点餐页频繁按 `category_id` 查询,加索引能让查询从全表扫描变成 O(log n)。

### 2.4 coupons —— 优惠券规则

```sql
CREATE TABLE coupons (
  id              VARCHAR(32) PRIMARY KEY,
  title           VARCHAR(100) NOT NULL,           -- 标题,如 "新人专享"
  condition_text  VARCHAR(200) NOT NULL,           -- 满减说明文案,如 "满 20 减 5"
  min_amount      DECIMAL(10,2) NOT NULL DEFAULT 0, -- 满减门槛
  discount_amount DECIMAL(10,2) NOT NULL,           -- 抵扣金额
  valid_until     VARCHAR(30)  NOT NULL,           -- 有效期(展示用字符串)
  available       TINYINT(1)   NOT NULL DEFAULT 1   -- 是否启用
);
```

`coupons` 表存的是"优惠券规则",**不是某个用户领的券**。用户领后会写入 `user_coupons` 表。

### 2.5 user_coupons —— 用户优惠券(状态机)

```sql
CREATE TABLE user_coupons (
  id          VARCHAR(40)  PRIMARY KEY,
  user_id     VARCHAR(40)  NOT NULL,                -- 谁的券
  coupon_id   VARCHAR(32)  NOT NULL,                -- 哪张券
  status      VARCHAR(20)  NOT NULL,                -- AVAILABLE / USED
  claimed_at  DATETIME     NOT NULL,                -- 领取时间
  used_at     DATETIME,                             -- 使用时间(可空)
  order_id    VARCHAR(40),                          -- 用在哪个订单(可空)
  UNIQUE KEY uk_user_coupon (user_id, coupon_id),   -- 同一用户同一券只能领一次
  INDEX idx_user_coupons_user_status (user_id, status)
);
```

**`UNIQUE KEY` 是这里最重要的约束** —— 它从数据库层面强制"一个用户不能领同一张券两次",哪怕代码有 bug 也不会出现重复行。

`status` 的两个值是字符串"AVAILABLE"和"USED",形成一个**状态机**:
```
领取  → AVAILABLE
下单  → USED   (used_at, order_id 同时填)
取消  → 回到 AVAILABLE
```
后面有专门一章讲状态机 SQL。

### 2.6 users —— 用户登录会话

```sql
CREATE TABLE users (
  id          VARCHAR(40)  PRIMARY KEY,
  openid      VARCHAR(100),                   -- 微信 openid,游客登录为 NULL
  nickname    VARCHAR(80)  NOT NULL,
  avatar_url  VARCHAR(300) NOT NULL DEFAULT '',
  token       VARCHAR(80),                    -- 登录 token,退出登录置 NULL
  created_at  DATETIME NOT NULL,
  updated_at  DATETIME NOT NULL,
  UNIQUE KEY uk_users_openid (openid),
  UNIQUE KEY uk_users_token (token)
);
```

**`openid` 和 `token` 都加了 `UNIQUE KEY`**:
- `openid` 唯一 → 一个微信用户只能对应一条 users 记录(再次登录走 update)
- `token` 唯一 → 不会出现两个用户用同一个 token

### 2.7 user_profiles —— 会员资料

```sql
CREATE TABLE user_profiles (
  user_id        VARCHAR(32) PRIMARY KEY,                -- 用户 ID(也是外键)
  nickname       VARCHAR(80) NOT NULL,
  member_level   VARCHAR(50) NOT NULL,                   -- 普通会员 / 省钱卡会员
  points         INT          NOT NULL DEFAULT 0,        -- 积分
  balance        DECIMAL(10,2) NOT NULL DEFAULT 0,       -- 余额
  coupon_count   INT          NOT NULL DEFAULT 0,        -- 可用券数量(缓存)
  saving_amount  DECIMAL(10,2) NOT NULL DEFAULT 0        -- 累计节省金额
);
```

为什么 `users` 和 `user_profiles` **拆成两张表**?
- `users` 是登录会话(token / openid / 时间戳),改动频繁
- `user_profiles` 是会员资料(等级 / 积分 / 节省金额),改动相对少
- 拆开后:登录的写入不会锁会员资料,反之亦然

### 2.8 cart_items —— 购物车

```sql
CREATE TABLE cart_items (
  id          VARCHAR(40) PRIMARY KEY,
  user_id     VARCHAR(40) NOT NULL,            -- 谁的购物车
  product_id  VARCHAR(32) NOT NULL,            -- 加了哪个商品
  spec        VARCHAR(200) NOT NULL,           -- 规格(中杯/温/默认糖)
  quantity    INT          NOT NULL,
  created_at  DATETIME NOT NULL,
  UNIQUE KEY uk_cart_user_product_spec (user_id, product_id, spec),
  INDEX idx_cart_user_id (user_id)
);
```

**注意这个 `UNIQUE KEY (user_id, product_id, spec)`** —— 同一用户对同一商品的同一规格,购物车里**只能有一行**。加购时:
- 找到这一行 → 更新数量(`quantity = quantity + N`)
- 找不到 → 插入新行

这就是为什么 `OrderingService.addCartItem` 要先 `findByProductAndSpec` 再决定 INSERT 还是 UPDATE。

### 2.9 orders + order_items —— 订单主表 + 明细

```sql
CREATE TABLE orders (
  id              VARCHAR(40)  PRIMARY KEY,
  user_id         VARCHAR(40)  NOT NULL,
  order_no        VARCHAR(40)  NOT NULL UNIQUE,    -- 订单号,如 UMO20260527125900AB12
  pickup_type     VARCHAR(40)  NOT NULL,            -- SELF_PICKUP / DELIVERY
  store_name      VARCHAR(100) NOT NULL,
  table_no        VARCHAR(40),
  remark          VARCHAR(300),
  status          VARCHAR(40)  NOT NULL,            -- WAITING_PICKUP / COMPLETED / CANCELED
  total_amount    DECIMAL(10,2) NOT NULL,           -- 商品总价
  discount_amount DECIMAL(10,2) NOT NULL,           -- 优惠金额
  payable_amount  DECIMAL(10,2) NOT NULL,           -- 实付金额
  created_at      DATETIME NOT NULL,
  INDEX idx_orders_user_id (user_id)
);

CREATE TABLE order_items (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id      VARCHAR(40) NOT NULL,
  product_id    VARCHAR(32) NOT NULL,
  product_name  VARCHAR(100) NOT NULL,             -- 注意:这里冗余存了商品名
  spec          VARCHAR(200) NOT NULL,
  price         DECIMAL(10,2) NOT NULL,             -- 注意:这里冗余存了价格
  quantity      INT NOT NULL,
  UNIQUE KEY uk_order_item (order_id, product_id, spec),
  INDEX idx_order_items_order_id (order_id)
);
```

**最重要的设计:`order_items` 冗余存了 `product_name` 和 `price`**。

为什么?**这是商品快照** —— 下单的瞬间,价格 / 名字被"冻结"。即使商品后来涨价或改名,这个订单的展示永远是当时的价格和名字。这是电商系统的标准做法。

---

## 3. SQL 基础

### 3.1 最简单的 SELECT —— 取一行

```sql
-- StoreMapper.findStore
SELECT * FROM stores LIMIT 1;
```

**逐字拆解:**
- `SELECT *` → 取所有列
- `FROM stores` → 从 stores 表
- `LIMIT 1` → 最多返回 1 行

`*` 在小项目无伤大雅,但**大项目里建议明确列出列名**,因为:
1. 表加列时 `SELECT *` 会拉更多数据,浪费带宽
2. 列顺序变化时 ORM 映射可能失效
3. 看代码不知道到底读了哪些字段

### 3.2 选指定列

```sql
-- StoreMapper.listCategories
SELECT id, name, sort_order AS sort FROM categories ORDER BY sort_order;
```

- `SELECT id, name, sort_order` → 只取这三列
- `sort_order AS sort` → 给列起别名(数据库列名是 snake_case,Java 字段是 camelCase 的 `sort`)
- 这个**别名**让 MyBatis 自动把 `sort_order` 列映射到 `Category.sort` 字段

---

## 4. WHERE 条件筛选

### 4.1 单条件

```sql
-- ProductMapper.findEnabledById
SELECT * FROM products WHERE id = #{productId} AND enabled = TRUE;
```

- `WHERE` → 加筛选条件
- `id = #{productId}` → 主键等于参数(`#{productId}` 是 MyBatis 占位符,会被替换并转义,**安全**)
- `AND` → 多条件取并集

⚠️ **永远用 `#{}` 不要用 `${}`**:
- `#{}` 会用预编译 + 参数绑定,**防 SQL 注入**
- `${}` 直接字符串拼接,**有注入风险**

### 4.2 模糊匹配

```sql
-- 来自 ProductMapper.listEnabled 的片段
WHERE LOWER(name) LIKE CONCAT('%', LOWER(#{keyword}), '%')
```

- `LIKE '%keyword%'` → 包含 keyword 的(% 是通配符,匹配任意字符)
- `LOWER(...)` → 转小写,让搜索忽略大小写
- `CONCAT(...)` → 字符串拼接,避免 SQL 注入

如果只用 `LIKE keyword` 就要求精确匹配,加 `%` 才是"模糊包含"。

### 4.3 NOT EQUAL

```sql
-- OrderMapper.sumPayableAmount
SELECT COALESCE(SUM(payable_amount), 0) FROM orders WHERE status <> 'CANCELED';
```

- `<>` 表示**不等于**(等价于 `!=`,但 SQL 更推荐用 `<>`)
- 含义:统计销售额时,**已取消订单不算**

---

## 5. JOIN 多表关联

JOIN 是把两张表"对齐拼起来"。本项目最经典的例子是查购物车:

### 5.1 INNER JOIN 实战

```sql
-- CartMapper.listCartItems
SELECT
  c.id, c.product_id, p.name AS product_name, c.spec, p.image, p.price, c.quantity
FROM cart_items c
JOIN products p ON p.id = c.product_id
WHERE c.user_id = #{userId}
ORDER BY c.created_at;
```

**逐字拆:**

| 部分 | 含义 |
|---|---|
| `cart_items c` | `cart_items` 表起别名 `c`(避免后面写一长串) |
| `JOIN products p` | 关联 `products` 表(别名 `p`) |
| `ON p.id = c.product_id` | 关联条件:商品表的 id 等于购物车的 product_id |
| `c.id, c.product_id` | 取购物车表的列 |
| `p.name AS product_name` | 取商品表的 name,**起别名** product_name(对齐 CartItem 类字段) |
| `p.image, p.price` | 取商品表的图片和价格 |

**JOIN 后的结果**:相当于把购物车每一行和它对应的商品记录"粘"在一起,然后再选列。

**为什么不直接在 cart_items 里存商品名和价格?**
- 因为商品的名字 / 图 / 价 在 products 表里。如果存两份会数据不同步(后台改价后,购物车里还是旧价)。
- 用 JOIN 实时拿,**永远是商品表当前的值**。

> 对比:`order_items` 反而**故意**冗余存了 product_name 和 price —— 因为订单要"冻结当时的价格"。两种设计取决于业务需求。

### 5.2 JOIN + 多条件 WHERE

```sql
-- UserMapper.findAvailableUserCoupon
SELECT
  uc.id, uc.user_id, uc.coupon_id,
  c.title, c.condition_text, c.min_amount, c.discount_amount, c.valid_until,
  c.available AS coupon_available,
  uc.status, uc.claimed_at, uc.used_at, uc.order_id
FROM user_coupons uc
JOIN coupons c ON uc.coupon_id = c.id
WHERE uc.user_id = #{userId}
  AND uc.coupon_id = #{couponId}
  AND uc.status = 'AVAILABLE';
```

下单时校验"用户是否能用这张券"。**两层条件**:
1. **uc 表**:`user_id = ?` + `coupon_id = ?` + `status = 'AVAILABLE'` → 限定到具体的"用户优惠券"记录
2. **JOIN 进来的 c 表字段**:券标题、满减门槛、抵扣金额(用来后续计算)

`c.available AS coupon_available` 是为了让 Java 能区分:
- `uc.status` → 这个**用户**的券是否可用(USED 还是 AVAILABLE)
- `coupon_available` → 这张**券规则**本身是否启用(后台可能把整张券下架)

---

## 6. ORDER BY 排序与 LIMIT

### 6.1 基础排序

```sql
-- StoreMapper.listEnabledBanners
SELECT ... FROM banners WHERE enabled = TRUE ORDER BY sort_order, id;
```

- `ORDER BY sort_order` → 按 sort_order 升序排
- `, id` → 当 sort_order 相同时,再按 id 排(保证排序稳定)

升降序:
- `ORDER BY x` 或 `ORDER BY x ASC` → 升序(小的在前)
- `ORDER BY x DESC` → 降序(大的在前)

### 6.2 多列排序(带表达式)

```sql
-- UserMapper.listUserCoupons
ORDER BY CASE WHEN uc.status = 'AVAILABLE' THEN 0 ELSE 1 END, uc.claimed_at DESC
```

**这是个"先按状态排,再按领取时间倒序"的复合排序**。

`CASE WHEN ... THEN 0 ELSE 1 END` 是 SQL 的 if-else 表达式:
- 状态是 AVAILABLE → 这条记录的排序值是 0
- 否则(USED) → 排序值是 1

然后按这个排序值升序,所以 AVAILABLE(=0)排前面,USED(=1)排后面。

再按 `claimed_at DESC` 二级排序:同状态的券,新领的排前面。

### 6.3 LIMIT

```sql
SELECT * FROM products ORDER BY sales DESC, id LIMIT 10;     -- 取销量前 10
SELECT * FROM products ORDER BY id LIMIT 20, 10;             -- 跳过 20 条,取 10 条(分页)
```

**分页公式**:`LIMIT (page-1)*size, size`(MySQL 语法)。

---

## 7. 动态 SQL

MyBatis 在注解里用 `<script>` 包裹后,可以写**条件性 SQL**。

### 7.1 `<if>` 拼条件

```java
// ProductMapper.listEnabled
@Select({
    "<script>",
    "SELECT * FROM products",
    "WHERE enabled = TRUE",
    "<if test='categoryId != null and categoryId != \"\"'>",
    "  AND category_id = #{categoryId}",
    "</if>",
    "<if test='keyword != null and keyword != \"\"'>",
    "  AND (LOWER(name) LIKE CONCAT('%', LOWER(#{keyword}), '%')",
    "       OR LOWER(description) LIKE CONCAT('%', LOWER(#{keyword}), '%'))",
    "</if>",
    "ORDER BY sales DESC, id",
    "</script>"
})
```

**根据参数动态拼接 SQL:**
- 不传 categoryId 也不传 keyword:`WHERE enabled = TRUE ORDER BY ...`
- 只传 categoryId:`WHERE enabled = TRUE AND category_id = ? ORDER BY ...`
- 只传 keyword:`WHERE enabled = TRUE AND (name LIKE ? OR description LIKE ?) ORDER BY ...`
- 都传:三个条件全加

### 7.2 `<where>` 智能处理 AND/WHERE

```java
// OrderMapper.findOrder
@Select({
    "<script>",
    "SELECT * FROM orders",
    "<where>",
    "id = #{orderId}",
    "<if test='userId != null and userId != \"\"'>",
    "AND user_id = #{userId}",
    "</if>",
    "</where>",
    "</script>"
})
```

`<where>` 标签会:
1. 自动加 `WHERE`(如果有任何条件)
2. 自动去掉**第一个条件**前面多余的 `AND`(防止生成 `WHERE AND xxx`)

如果 `userId` 是 null → SQL 是 `SELECT * FROM orders WHERE id = ?`
如果 `userId` 非空 → SQL 是 `SELECT * FROM orders WHERE id = ? AND user_id = ?`

---

## 8. INSERT 插入

### 8.1 标准 INSERT

```sql
-- CartMapper.insertForUser
INSERT INTO cart_items (id, user_id, product_id, spec, quantity, created_at)
VALUES (#{id}, #{userId}, #{productId}, #{spec}, #{quantity}, CURRENT_TIMESTAMP);
```

**结构:**
```
INSERT INTO 表名 (列 1, 列 2, ...)
VALUES (值 1, 值 2, ...);
```

- 必须明确列出列名(强烈建议),否则列顺序变了会出错。
- `CURRENT_TIMESTAMP` 是 MySQL 内置函数,会取当前时间。

### 8.2 复杂 INSERT(带 TypeHandler)

```sql
-- ProductMapper.insert
INSERT INTO products (id, category_id, name, description, image, price, sales, tags, enabled)
VALUES (#{id}, #{categoryId}, #{name}, #{description}, #{image}, #{price}, #{sales},
       #{tags,typeHandler=com.unmanned.ordering.config.StringListTypeHandler}, #{enabled});
```

`#{tags,typeHandler=StringListTypeHandler}` 告诉 MyBatis:**写入前先把 List<String> 转成逗号分隔字符串**。这是 Java 与 DB 类型差异时的桥梁。

---

## 9. UPDATE 修改 + 防御性写法

### 9.1 简单 UPDATE

```sql
-- OrderMapper.updateStatus
UPDATE orders SET status = #{status} WHERE id = #{orderId};
```

**结构:**
```
UPDATE 表名 SET 列名 = 新值, ... WHERE 条件;
```

⚠️ **永远不要忘 WHERE**(忘了就是全表更新,灾难性后果)。

### 9.2 自增字段

```sql
-- ProductMapper.increaseSales
UPDATE products SET sales = sales + #{quantity} WHERE id = #{productId};
```

`sales = sales + #{quantity}` —— 读取旧值,加上参数,写回去。一句 SQL 完成"读 + 改 + 写"原子操作。

如果改成两步:
```java
// 错误示范!并发不安全
int current = mapper.getSales(id);   // 读
mapper.setSales(id, current + n);    // 写
```
两个用户同时下单时,可能两人都读到 100,各 +1,最后只 +1 而不是 +2。**用一条 UPDATE 就避免这个问题**。

### 9.3 防御性写法 —— CASE WHEN 防负数

```sql
-- ProductMapper.decreaseSales
UPDATE products
SET sales = CASE WHEN sales > #{quantity} THEN sales - #{quantity} ELSE 0 END
WHERE id = #{productId};
```

**拆开看:**
- 如果当前 `sales > quantity` → `sales - quantity`(正常扣)
- 否则 → 设为 0(防止扣成负数)

为什么要这层保护?如果代码有 bug 或并发问题,直接 `sales - n` 可能让销量变负数,展示出来很难看。`CASE WHEN` 保证销量永远 ≥ 0。

类似的还有 `UserMapper.subtractOrderStats`(取消订单时扣积分),也用同样的写法保护。

### 9.4 防御性写法 —— 状态判定(乐观锁)

```sql
-- UserMapper.markUserCouponUsed
UPDATE user_coupons
SET status = 'USED', used_at = #{usedAt}, order_id = #{orderId}
WHERE user_id = #{userId} AND coupon_id = #{couponId}
  AND status = 'AVAILABLE';
```

注意 `WHERE` 里**多了 `AND status = 'AVAILABLE'`**!这是关键。

**这是一种"乐观锁"写法**:
- 如果券还可用 → 这条 SQL 影响 1 行,标记成功
- 如果券已经被其他订单用了 → `status` 已经是 'USED',这条 SQL 影响 0 行
- Java 代码可以根据"影响行数"判断:0 行就说明并发冲突,抛"券已使用"错误

这就避免了**两个订单同时用同一张券**的并发问题。

---

## 10. DELETE 删除 vs 软删除

### 10.1 真删

```sql
-- CartMapper.deleteById
DELETE FROM cart_items WHERE id = #{itemId} AND user_id = #{userId};
```

注意带 `user_id` 条件 —— **防越权**。如果只写 `WHERE id = ?`,A 用户传 B 用户的 itemId,会把 B 的购物车项删掉。带上 user_id 后,只能删自己的。

### 10.2 软删(标志位)

```sql
-- ProductMapper.disable
UPDATE products SET enabled = FALSE WHERE id = #{productId};

-- StoreMapper.disableBanner
UPDATE banners SET enabled = FALSE WHERE id = #{bannerId};

-- StoreMapper.disableCoupon
UPDATE coupons SET available = FALSE WHERE id = #{couponId};
```

商品 / Banner / 优惠券都用**软删除**(`enabled = FALSE`)而不是 DELETE。

为什么?**因为历史订单引用了这些数据**。比如订单 #100 用了 "拿铁咖啡"(product_id = P-1001),如果你 DELETE 这个商品,订单详情页可能就显示不出来。**软删除保留数据,只是让它在前台不可见**,历史订单永远能正常显示。

只有**分类**用真删:`DELETE FROM categories WHERE id = ?`,但 Service 层会先校验该分类下没有商品才允许删。

---

## 11. 聚合函数

### 11.1 COUNT 计数

```sql
SELECT COUNT(*) FROM cart_items;                 -- 全表条数
SELECT COUNT(*) FROM products WHERE enabled = TRUE;   -- 上架商品数
```

### 11.2 SUM 求和

```sql
-- OrderMapper.sumPayableAmount
SELECT COALESCE(SUM(payable_amount), 0) FROM orders WHERE status <> 'CANCELED';
```

- `SUM(payable_amount)` → 把所有 payable_amount 加起来
- `COALESCE(SUM(...), 0)` → 如果 SUM 是 NULL(表为空时会发生),用 0 兜底

为什么要 `COALESCE`?**当 orders 表里一条记录都没有时**,`SUM` 返回 NULL,Java 端取到会变成 null,后续 `.intValue()` 会 NPE。用 0 兜底永远不会出错。

### 11.3 子查询 + 聚合(高级)

```sql
-- UserMapper.refreshCouponCount
UPDATE user_profiles
SET coupon_count = (
  SELECT COUNT(*) FROM user_coupons
  WHERE user_id = #{userId} AND status = 'AVAILABLE'
)
WHERE user_id = #{userId};
```

**外层 UPDATE,内层 SELECT** —— 这叫**子查询**。

整句意思:更新某用户的 `coupon_count` 字段,值等于"该用户可用券的实时数量"。

**为什么这么写?** 因为 `coupon_count` 是个缓存字段,不是真正的数据源。每次领券 / 用券 / 取消订单都要重新算一遍并刷进 user_profiles,这样"我的页"加载时不用再去 count,直接读字段就行。

---

## 12. 状态机 SQL

本项目最关键的两个状态机:

### 12.1 用户优惠券状态机

```
AVAILABLE ──下单──→ USED ──取消订单──→ AVAILABLE
```

**领取(写入 AVAILABLE):**
```sql
INSERT INTO user_coupons (id, user_id, coupon_id, status, claimed_at)
VALUES (?, ?, ?, 'AVAILABLE', ?);
```

**下单使用(AVAILABLE → USED):**
```sql
UPDATE user_coupons
SET status = 'USED', used_at = ?, order_id = ?
WHERE user_id = ? AND coupon_id = ? AND status = 'AVAILABLE';
```
注意 WHERE 里有 `status = 'AVAILABLE'`,这是乐观锁,防止重复使用。

**取消订单(USED → AVAILABLE):**
```sql
UPDATE user_coupons
SET status = 'AVAILABLE', used_at = NULL, order_id = NULL
WHERE user_id = ? AND order_id = ? AND status = 'USED';
```
把 used_at 和 order_id 也置 NULL,等于这张券"重新可用"。

### 12.2 订单状态机

```
WAITING_PICKUP ──店员"完成"──→ COMPLETED
       │
       └──用户/店员"取消"──→ CANCELED
```

**生成订单时初始状态:**
```sql
INSERT INTO orders (..., status, ...) VALUES (..., 'WAITING_PICKUP', ...);
```

**状态转移:**
```sql
UPDATE orders SET status = 'COMPLETED' WHERE id = ?;
UPDATE orders SET status = 'CANCELED' WHERE id = ?;
```

业务规则不是写在 SQL 里,而是在 `OrderingService` 里判断(如"已完成订单不能取消")。

---

## 13. 常见踩坑点

### 13.1 永远用参数化查询

```sql
-- ❌ 千万别这样拼
String sql = "SELECT * FROM users WHERE token = '" + token + "'";

-- ✅ 永远用 ?
SELECT * FROM users WHERE token = #{token};
```

字符串拼接会导致 SQL 注入:用户传 `token = "x' OR '1'='1"`,SQL 就变成 `WHERE token = 'x' OR '1'='1'`,全表数据全被读走。

### 13.2 永远不要忘 WHERE

```sql
DELETE FROM users;          -- 灾难!全表删除
UPDATE products SET enabled = FALSE;  -- 灾难!所有商品下架
```

写完 UPDATE/DELETE 后**多看一遍 WHERE 子句**。

### 13.3 金额用 DECIMAL,不用 FLOAT/DOUBLE

```sql
-- ❌
CREATE TABLE orders (... price FLOAT ...);

-- ✅
CREATE TABLE orders (... price DECIMAL(10, 2) ...);
```

浮点数有精度问题:`0.1 + 0.2 = 0.30000000000000004`。算账时会出错。`DECIMAL` 是精确十进制,适合金额。

### 13.4 索引要建在 WHERE / JOIN 条件的列上

```sql
INDEX idx_products_category (category_id);              -- 因为常 WHERE category_id = ?
INDEX idx_cart_user_id (user_id);                       -- 因为常 WHERE user_id = ?
INDEX idx_user_coupons_user_status (user_id, status);   -- 因为常一起作为筛选条件
```

没索引时,WHERE 是全表扫描;有索引时是 O(log n) 二分查找。**100 万行数据相差几千倍**。

### 13.5 别 SELECT * 在生产代码

简单 demo 用 `SELECT *` 没事,但生产代码:
1. 表加列会拉无关数据
2. 用 ORM 时容易撞到列名变更问题
3. 看不出代码在用哪些字段

明确列出列名,代码更显式。

### 13.6 别在循环里查 SQL(N+1 问题)

```java
// ❌ 慢
for (Order order : orders) {
    order.setItems(orderMapper.listOrderItems(order.getId()));   // 一次查询 → 100 个订单 100 次查询
}

// ✅ 快(本项目当前是 N+1,可以以后优化)
// 改成 IN 一次查所有订单的明细:
// SELECT * FROM order_items WHERE order_id IN (?, ?, ?, ...)
// 然后在 Java 里按 order_id 分组
```

本项目当前用了 N+1(`OrderingService.listOrders` 里的 `attachOrderItems`),订单不多时无所谓,订单数过万时就慢了。**这是常见的优化点,知道有这事就行**。

---

## 接下来怎么学

**看你的代码学 SQL** 才是最快的方法:

1. 打开 `backend/src/main/java/com/unmanned/ordering/mapper/` 任一文件
2. 对照本文档,逐句理解每条 SQL 在做什么
3. 关联到 `service/OrderingService.java`,看每条 SQL 是被哪个业务函数调的
4. 想动手练 → 用 MySQL 客户端直连数据库:
   ```bash
   mysql -u root -p
   USE unmanned_ordering;
   SELECT * FROM products LIMIT 5;
   ```

如果遇到看不懂的 SQL,回到本文档对应章节再看一遍;真不行的话直接问。
