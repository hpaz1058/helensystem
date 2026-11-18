-- ==============================================================================
-- THREAD & CO. — CLOUD MYSQL DATABASE DEPLOYMENT SCRIPT (FOR TIDB CLOUD)
-- System: Thread & Co. (Modern Wardrobe Essentials E-Commerce PWA)
-- Platform: TiDB Serverless Cloud (MySQL 8.0 Compatible)
-- Author: Helen Paz (hpaz1058@gmail.com)
-- Course: WS102 (Web Systems 2) & CC106 (Application Development & Emerging Tech)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DATABASE CREATION
-- ------------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS thread_co_db;
USE thread_co_db;

-- ------------------------------------------------------------------------------
-- 2. PRODUCTS TABLE (WS102 Main CRUD Table)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. USERS TABLE (System Roles & Local Records)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS user;

CREATE TABLE user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. ORDERS TABLE (Customer Purchases & Shipping Tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_uid VARCHAR(128) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(30),
    shipping_address TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'COD',
    gcash_reference VARCHAR(100) DEFAULT '',
    order_status VARCHAR(50) NOT NULL DEFAULT 'Processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. ORDER ITEMS TABLE (Line Items for Each Order)
-- ------------------------------------------------------------------------------
CREATE TABLE order_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 6. ACTIVITY LOGS TABLE (User Action & Audit Logging)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS activity_logs;

CREATE TABLE activity_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL,
    user_uid VARCHAR(128),
    user_email VARCHAR(120),
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. SEED DATA: PRODUCTS CATALOG (Thread & Co. Wardrobe Essentials)
-- ------------------------------------------------------------------------------
INSERT INTO products (product_id, product_name, category, price, stock_quantity, description) VALUES
    (1, 'Basic Tee', 'Tops', 399.00, 25, 'A clean everyday tee with a relaxed modern fit crafted from breathable organic cotton.'),
    (2, 'Ribbed Knit Top', 'Tops', 499.00, 15, 'Soft ribbed texture designed for easy layering and day-to-evening styling.'),
    (3, 'Blouse', 'Tops', 599.00, 20, 'An airy blouse that works seamlessly from desk to dinner with refined tailoring.'),
    (4, 'Mid Dress', 'Dresses', 799.00, 10, 'A timeless midi silhouette with an effortless drape and flattering waistline.'),
    (5, 'Wide Leg Pants', 'Bottoms', 699.00, 18, 'Flowy wide-leg pants with an elevated everyday feel and comfortable high waistband.'),
    (6, 'Sweater', 'Tops', 699.00, 12, 'A cozy knit pullover for cooler days and relaxed weekend layering.'),
    (7, 'Cardigan', 'Tops', 749.00, 14, 'A lightweight open-front cardigan for timeless transitional layering.'),
    (8, 'Shoulder Bag', 'Accessories', 899.00, 8, 'Structured vegan leather shoulder bag with a polished everyday shape.');

-- ------------------------------------------------------------------------------
-- 8. SEED DATA: INITIAL USERS & ROLES
-- ------------------------------------------------------------------------------
INSERT INTO user (name, email, role) VALUES
    ('Helen Paz', 'hpaz1058@gmail.com', 'admin'),
    ('Customer User', 'customer@threadco.com', 'user');

-- ------------------------------------------------------------------------------
-- 9. SEED DATA: SAMPLE INITIAL ORDER
-- ------------------------------------------------------------------------------
INSERT INTO orders (order_id, customer_uid, customer_name, customer_email, customer_phone, shipping_address, total_amount, payment_method, order_status) VALUES
    (1, 'miEhlAmtbYPSPWJvLHVLUkv3DSp2', 'Helen Paz', 'hpaz1058@gmail.com', '09171234567', 'Manila, Philippines', 1897.00, 'GCash', 'Processing');

INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES
    (1, 4, 'Mid Dress', 799.00, 1),
    (1, 2, 'Ribbed Knit Top', 499.00, 1),
    (1, 5, 'Wide Leg Pants', 699.00, 1);

-- ------------------------------------------------------------------------------
-- 10. VERIFICATION SELECT QUERIES
-- ------------------------------------------------------------------------------
SELECT 'Products Loaded:' AS Status, COUNT(*) AS Total FROM products;
SELECT product_id, product_name, category, price, stock_quantity FROM products;
SELECT * FROM user;
SELECT * FROM orders;
