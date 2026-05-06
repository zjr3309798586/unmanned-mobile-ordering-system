CREATE TABLE stores (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(200) NOT NULL,
  distance VARCHAR(30) NOT NULL,
  business_hours VARCHAR(50) NOT NULL,
  notice VARCHAR(500) NOT NULL
);

CREATE TABLE categories (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  sort_order INT NOT NULL
);

CREATE TABLE products (
  id VARCHAR(32) PRIMARY KEY,
  category_id VARCHAR(32) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL,
  image VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  sales INT NOT NULL DEFAULT 0,
  tags VARCHAR(200) NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE coupons (
  id VARCHAR(32) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  condition_text VARCHAR(200) NOT NULL,
  min_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL,
  valid_until VARCHAR(30) NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE user_coupons (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  coupon_id VARCHAR(32) NOT NULL,
  status VARCHAR(20) NOT NULL,
  claimed_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  order_id VARCHAR(40),
  UNIQUE (user_id, coupon_id)
);

CREATE TABLE saving_card_plans (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description VARCHAR(500) NOT NULL,
  benefits VARCHAR(500) NOT NULL DEFAULT ''
);

CREATE TABLE banners (
  id VARCHAR(40) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(300) NOT NULL DEFAULT '',
  tag_text VARCHAR(40) NOT NULL DEFAULT '',
  image VARCHAR(300) NOT NULL DEFAULT '',
  link_text VARCHAR(40) NOT NULL DEFAULT '',
  link_url VARCHAR(120) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE user_profiles (
  user_id VARCHAR(32) PRIMARY KEY,
  nickname VARCHAR(80) NOT NULL,
  member_level VARCHAR(50) NOT NULL,
  points INT NOT NULL DEFAULT 0,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  coupon_count INT NOT NULL DEFAULT 0,
  saving_amount DECIMAL(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE users (
  id VARCHAR(40) PRIMARY KEY,
  openid VARCHAR(100),
  nickname VARCHAR(80) NOT NULL,
  avatar_url VARCHAR(300) NOT NULL DEFAULT '',
  token VARCHAR(80),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE (openid),
  UNIQUE (token)
);

CREATE TABLE cart_items (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  product_id VARCHAR(32) NOT NULL,
  spec VARCHAR(200) NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  UNIQUE (user_id, product_id, spec)
);

CREATE TABLE orders (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  order_no VARCHAR(40) NOT NULL UNIQUE,
  pickup_type VARCHAR(40) NOT NULL,
  store_name VARCHAR(100) NOT NULL,
  table_no VARCHAR(40),
  remark VARCHAR(300),
  status VARCHAR(40) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  payable_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(40) NOT NULL,
  product_id VARCHAR(32) NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  spec VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  UNIQUE (order_id, product_id, spec)
);
