MERGE INTO stores KEY(id) VALUES
('STORE-001', 'Campus Smart Pickup Store', 'Teaching Building A, 1F', '350m', '09:00-21:30',
 'Database version is running. Product, cart and order data are stored in MySQL.');

MERGE INTO categories KEY(id) VALUES
('coffee', 'Coffee', 1),
('tea', 'Fruit Tea', 2),
('milk', 'Milk Tea', 3),
('snack', 'Snacks', 4);

MERGE INTO products KEY(id) VALUES
('P-1001', 'coffee', 'Orange Americano', 'Fresh orange aroma with a light coffee finish.', '/images/product-orange-coffee.svg', 15.90, 388, 'Popular,Iced', TRUE),
('P-1002', 'coffee', 'Coconut Latte', 'Coconut milk and espresso with a creamy texture.', '/images/product-coconut-latte.svg', 17.90, 246, 'New', TRUE),
('P-1003', 'tea', 'Grapefruit Green Tea', 'Refreshing grapefruit pulp with green tea.', '/images/product-grapefruit-tea.svg', 13.90, 520, 'Popular', TRUE),
('P-1004', 'milk', 'Brown Sugar Milk Tea', 'Brown sugar syrup, fresh milk and chewy pearls.', '/images/product-milk-tea.svg', 14.90, 301, 'Sweet', TRUE),
('P-1005', 'tea', 'Lemon Tea', 'Bright lemon flavor, low calorie and refreshing.', '/images/product-lemon-tea.svg', 12.90, 198, 'Light', TRUE),
('P-1006', 'snack', 'Cheese Toast', 'Warm toast with cheese and light butter.', '/images/product-toast.svg', 9.90, 156, 'Snack', TRUE);

MERGE INTO coupons KEY(id) VALUES
('C-001', 'New user coupon', 'Use on orders over 20', 5.00, '2026-12-31', TRUE),
('C-002', 'Afternoon tea coupon', 'Use on orders over 30', 8.00, '2026-12-31', TRUE),
('C-003', 'Member coupon', 'Use on orders over 15', 3.00, '2026-12-31', TRUE);

MERGE INTO saving_card_plans KEY(id) VALUES
('S-001', 'Monthly Saving Card', 9.90, 'Unlock member coupons and selected product discounts for 30 days.',
 '4 exclusive coupons,Selected product saving price,Member birthday benefit');

MERGE INTO user_profiles KEY(user_id) VALUES
('USER-001', 'Guest User', 'Silver Member', 1280, 36.80, 3, 18.50);

MERGE INTO orders KEY(id) VALUES
('ORDER-DEMO-001', 'UMO202605040001', 'SELF_PICKUP', 'Campus Smart Pickup Store', 'A12',
 'Demo order', 'COMPLETED', 29.80, 5.00, 24.80, '2026-05-04 10:30:00');

MERGE INTO order_items (id, order_id, product_id, product_name, spec, price, quantity) KEY(id) VALUES
(1, 'ORDER-DEMO-001', 'P-1001', 'Orange Americano', 'Iced / Regular sugar', 15.90, 1),
(2, 'ORDER-DEMO-001', 'P-1003', 'Grapefruit Green Tea', 'Regular', 13.90, 1);
