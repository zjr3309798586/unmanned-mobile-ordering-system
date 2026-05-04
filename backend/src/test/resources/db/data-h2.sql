MERGE INTO stores KEY(id) VALUES
('STORE-001', '智慧点餐示范店', '教学楼 A 座 1 层', '350m', '09:00-21:30',
 '当前已连接 MySQL 数据库，商品、购物车和订单数据都会保存到后端。');

MERGE INTO categories KEY(id) VALUES
('coffee', '咖啡', 1),
('tea', '果茶', 2),
('milk', '奶茶', 3),
('snack', '小食', 4);

MERGE INTO products KEY(id) VALUES
('P-1001', 'coffee', '橙香美式', '清爽橙香搭配轻盈咖啡风味，适合冰饮和少糖口味。', '/images/product-orange-coffee.svg', 15.90, 388, '热销,冰饮', TRUE),
('P-1002', 'coffee', '椰乳拿铁', '椰乳与浓缩咖啡融合，口感顺滑，适合午后提神。', '/images/product-coconut-latte.svg', 17.90, 246, '新品', TRUE),
('P-1003', 'tea', '满杯西柚绿茶', '西柚果粒搭配绿茶茶底，酸甜清爽，适合夏季。', '/images/product-grapefruit-tea.svg', 13.90, 520, '热销,清爽', TRUE),
('P-1004', 'milk', '黑糖珍珠奶茶', '黑糖糖浆、鲜奶与珍珠组合，甜香浓郁。', '/images/product-milk-tea.svg', 14.90, 301, '甜香', TRUE),
('P-1005', 'tea', '柠檬冰茶', '柠檬清香明显，低负担又解腻。', '/images/product-lemon-tea.svg', 12.90, 198, '轻负担', TRUE),
('P-1006', 'snack', '芝士烤吐司', '现烤吐司搭配芝士和黄油，适合配饮品。', '/images/product-toast.svg', 9.90, 156, '小食', TRUE);

MERGE INTO coupons KEY(id) VALUES
('C-001', '新人立减券', '满 20 元可用', 5.00, '2026-12-31', TRUE),
('C-002', '下午茶优惠券', '满 30 元可用', 8.00, '2026-12-31', TRUE),
('C-003', '会员专享券', '满 15 元可用', 3.00, '2026-12-31', TRUE);

MERGE INTO saving_card_plans KEY(id) VALUES
('S-001', '月度省钱卡', 9.90, '开通 30 天内可领取会员专属券，并享受指定商品省钱价。',
 '4 张专属优惠券,指定商品省钱价,会员生日权益');

MERGE INTO user_profiles KEY(user_id) VALUES
('USER-001', '访客用户', '银卡会员', 1280, 36.80, 3, 18.50);

MERGE INTO orders KEY(id) VALUES
('ORDER-DEMO-001', 'UMO202605040001', 'SELF_PICKUP', '智慧点餐示范店', 'A12',
 '演示订单', 'COMPLETED', 29.80, 5.00, 24.80, '2026-05-04 10:30:00');

MERGE INTO order_items (id, order_id, product_id, product_name, spec, price, quantity) KEY(id) VALUES
(1, 'ORDER-DEMO-001', 'P-1001', '橙香美式', '少冰 / 五分糖', 15.90, 1),
(2, 'ORDER-DEMO-001', 'P-1003', '满杯西柚绿茶', '标准杯', 13.90, 1);
