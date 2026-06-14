CREATE TABLE IF NOT EXISTS stores (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(200) NOT NULL,
  distance VARCHAR(30) NOT NULL,
  business_hours VARCHAR(50) NOT NULL,
  notice VARCHAR(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  sort_order INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(32) PRIMARY KEY,
  category_id VARCHAR(32) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL,
  image VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  sales INT NOT NULL DEFAULT 0,
  tags VARCHAR(200) NOT NULL DEFAULT '',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  INDEX idx_products_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(32) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  condition_text VARCHAR(200) NOT NULL,
  min_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL,
  valid_until VARCHAR(30) NOT NULL,
  available TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_coupons (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  coupon_id VARCHAR(32) NOT NULL,
  status VARCHAR(20) NOT NULL,
  claimed_at DATETIME NOT NULL,
  used_at DATETIME,
  order_id VARCHAR(40),
  UNIQUE KEY uk_user_coupon (user_id, coupon_id),
  INDEX idx_user_coupons_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS saving_card_plans (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description VARCHAR(500) NOT NULL,
  benefits VARCHAR(500) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS banners (
  id VARCHAR(40) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(300) NOT NULL DEFAULT '',
  tag_text VARCHAR(40) NOT NULL DEFAULT '',
  image VARCHAR(300) NOT NULL DEFAULT '',
  link_text VARCHAR(40) NOT NULL DEFAULT '',
  link_url VARCHAR(120) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id VARCHAR(32) PRIMARY KEY,
  nickname VARCHAR(80) NOT NULL,
  member_level VARCHAR(50) NOT NULL,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  coupon_count INT NOT NULL DEFAULT 0,
  saving_amount DECIMAL(10, 2) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_addresses (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  receiver_name VARCHAR(80) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  address_detail VARCHAR(240) NOT NULL,
  default_address TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_user_addresses_user (user_id),
  INDEX idx_user_addresses_default (user_id, default_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_favorites (
  user_id VARCHAR(40) NOT NULL,
  product_id VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (user_id, product_id),
  INDEX idx_user_favorites_user (user_id),
  INDEX idx_user_favorites_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(40) PRIMARY KEY,
  openid VARCHAR(100),
  nickname VARCHAR(80) NOT NULL,
  avatar_url VARCHAR(300) NOT NULL DEFAULT '',
  token VARCHAR(80),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_users_openid (openid),
  UNIQUE KEY uk_users_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cart_items (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  product_id VARCHAR(32) NOT NULL,
  spec VARCHAR(200) NOT NULL,
  quantity INT NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uk_cart_user_product_spec (user_id, product_id, spec),
  INDEX idx_cart_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  order_no VARCHAR(40) NOT NULL UNIQUE,
  pickup_type VARCHAR(40) NOT NULL,
  store_name VARCHAR(100) NOT NULL,
  table_no VARCHAR(40),
  delivery_address VARCHAR(200),
  delivery_contact VARCHAR(80),
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  remark VARCHAR(300),
  status VARCHAR(40) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  payable_amount DECIMAL(10, 2) NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_orders_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS support_tickets (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  order_id VARCHAR(40),
  type VARCHAR(40) NOT NULL,
  content VARCHAR(1000) NOT NULL,
  contact VARCHAR(100) NOT NULL DEFAULT '',
  reply_content VARCHAR(1000),
  status VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL,
  replied_at DATETIME,
  closed_at DATETIME,
  INDEX idx_support_tickets_user (user_id),
  INDEX idx_support_tickets_status (status),
  INDEX idx_support_tickets_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(40) NOT NULL,
  product_id VARCHAR(32) NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  spec VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  UNIQUE KEY uk_order_item (order_id, product_id, spec),
  INDEX idx_order_items_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE coupons ADD COLUMN min_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER condition_text',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coupons' AND COLUMN_NAME = 'min_amount'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE cart_items ADD COLUMN user_id VARCHAR(40) NOT NULL DEFAULT ''USER-SEED-001''',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND COLUMN_NAME = 'user_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) > 0,
    'ALTER TABLE cart_items DROP INDEX uk_cart_product_spec',
    'SELECT 1')
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND INDEX_NAME = 'uk_cart_product_spec'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE cart_items ADD UNIQUE KEY uk_cart_user_product_spec (user_id, product_id, spec)',
    'SELECT 1')
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' AND INDEX_NAME = 'uk_cart_user_product_spec'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE orders ADD COLUMN user_id VARCHAR(40) NOT NULL DEFAULT ''USER-SEED-001'' AFTER id',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'user_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE orders ADD INDEX idx_orders_user_id (user_id)',
    'SELECT 1')
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_orders_user_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE orders ADD COLUMN delivery_address VARCHAR(200) AFTER table_no',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_address'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE orders ADD COLUMN delivery_contact VARCHAR(80) AFTER delivery_address',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_contact'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER delivery_contact',
    'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'delivery_fee'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
