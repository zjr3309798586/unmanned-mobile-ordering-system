INSERT INTO stores (id, name, address, distance, business_hours, notice)
VALUES ('STORE-001', '智慧点餐校区店', '教学楼 A 座 1 层', '350m', '09:00-21:30',
        '当前已连接 MySQL 数据库，商品、购物车和订单数据都会保存到后端。')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  address = VALUES(address),
  distance = VALUES(distance),
  business_hours = VALUES(business_hours),
  notice = VALUES(notice);

INSERT INTO categories (id, name, sort_order) VALUES
('coffee', '咖啡', 1),
('tea', '果茶', 2),
('milk', '奶茶', 3),
('snack', '小食', 4)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  sort_order = VALUES(sort_order);

INSERT INTO products (id, category_id, name, description, image, price, sales, tags, enabled) VALUES
('P-1001', 'coffee', '橙香美式', '清爽橙香搭配轻盈咖啡风味，适合冰饮和少糖口味。', '/images/product-orange-coffee.svg', 15.90, 388, '热销,冰饮', 1),
('P-1002', 'coffee', '椰乳拿铁', '椰乳与浓缩咖啡融合，口感顺滑，适合午后提神。', '/images/product-coconut-latte.svg', 17.90, 246, '新品', 1),
('P-1003', 'tea', '满杯西柚绿茶', '西柚果粒搭配绿茶茶底，酸甜清爽，适合夏季。', '/images/product-grapefruit-tea.svg', 13.90, 520, '热销,清爽', 1),
('P-1004', 'milk', '黑糖珍珠奶茶', '黑糖糖浆、鲜奶与珍珠组合，甜香浓郁。', '/images/product-milk-tea.svg', 14.90, 301, '甜香', 1),
('P-1005', 'tea', '柠檬冰茶', '柠檬清香明显，低负担又解腻。', '/images/product-lemon-tea.svg', 12.90, 198, '轻负担', 1),
('P-1006', 'snack', '芝士烤吐司', '现烤吐司搭配芝士和黄油，适合配饮品。', '/images/product-toast.svg', 9.90, 156, '小食', 1)
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  name = VALUES(name),
  description = VALUES(description),
  image = VALUES(image),
  price = VALUES(price),
  sales = VALUES(sales),
  tags = VALUES(tags),
  enabled = VALUES(enabled);

INSERT INTO coupons (id, title, condition_text, discount_amount, valid_until, available) VALUES
('C-001', '新人立减券', '满 20 元可用', 5.00, '2026-12-31', 1),
('C-002', '下午茶优惠券', '满 30 元可用', 8.00, '2026-12-31', 1),
('C-003', '会员专享券', '满 15 元可用', 3.00, '2026-12-31', 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  condition_text = VALUES(condition_text),
  discount_amount = VALUES(discount_amount),
  valid_until = VALUES(valid_until),
  available = VALUES(available);

INSERT INTO saving_card_plans (id, name, price, description, benefits) VALUES
('S-001', '月度省钱卡', 9.90, '开通 30 天内可领取会员专属券，并享受指定商品省钱价。',
 '4 张专属优惠券,指定商品省钱价,会员生日权益')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price = VALUES(price),
  description = VALUES(description),
  benefits = VALUES(benefits);

INSERT INTO users (id, openid, nickname, avatar_url, token, created_at, updated_at) VALUES
('USER-SEED-001', NULL, '历史用户', '', NULL, '2026-05-04 10:00:00', '2026-05-04 10:00:00')
ON DUPLICATE KEY UPDATE
  nickname = VALUES(nickname),
  avatar_url = VALUES(avatar_url),
  updated_at = VALUES(updated_at);

INSERT INTO user_profiles (user_id, nickname, member_level, points, balance, coupon_count, saving_amount) VALUES
('USER-SEED-001', '历史用户', '银卡会员', 1280, 36.80, 3, 18.50)
ON DUPLICATE KEY UPDATE
  nickname = VALUES(nickname),
  member_level = VALUES(member_level),
  points = VALUES(points),
  balance = VALUES(balance),
  coupon_count = VALUES(coupon_count),
  saving_amount = VALUES(saving_amount);

DELETE FROM user_profiles
WHERE user_id = 'USER-001';

DELETE item FROM order_items item
JOIN orders legacy_order ON item.order_id = legacy_order.id
WHERE legacy_order.order_no = 'UMO202605040001'
  AND legacy_order.id <> 'ORDER-SEED-001';

DELETE FROM orders
WHERE order_no = 'UMO202605040001'
  AND id <> 'ORDER-SEED-001';

INSERT INTO orders (id, user_id, order_no, pickup_type, store_name, table_no, remark, status,
                    total_amount, discount_amount, payable_amount, created_at)
VALUES ('ORDER-SEED-001', 'USER-SEED-001', 'UMO202605040001', 'SELF_PICKUP', '智慧点餐校区店', 'A12',
        '历史订单', 'COMPLETED', 29.80, 5.00, 24.80, '2026-05-04 10:30:00')
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id),
  pickup_type = VALUES(pickup_type),
  store_name = VALUES(store_name),
  table_no = VALUES(table_no),
  remark = VALUES(remark),
  status = VALUES(status),
  total_amount = VALUES(total_amount),
  discount_amount = VALUES(discount_amount),
  payable_amount = VALUES(payable_amount),
  created_at = VALUES(created_at);

INSERT INTO order_items (order_id, product_id, product_name, spec, price, quantity)
VALUES ('ORDER-SEED-001', 'P-1001', '橙香美式', '少冰 / 五分糖', 15.90, 1),
       ('ORDER-SEED-001', 'P-1003', '满杯西柚绿茶', '标准杯', 13.90, 1)
ON DUPLICATE KEY UPDATE
  product_name = VALUES(product_name),
  spec = VALUES(spec),
  price = VALUES(price),
  quantity = VALUES(quantity);

UPDATE orders
SET store_name = '智慧点餐校区店'
WHERE store_name = 'Campus Smart Pickup Store';

UPDATE order_items item
JOIN products product ON item.product_id = product.id
SET item.product_name = product.name;
