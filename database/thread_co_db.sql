-- ==============================================================================
-- LABORATORY ACTIVITY: Database Implementation Based on Your Proposed System
-- System: Thread & Co. (E-Commerce Clothing & Apparel Management System)
-- Proposed Database: thread_co_db
-- Main Table: products
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 2: Create Your Database in phpMyAdmin
-- ------------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS thread_co_db;
USE thread_co_db;

-- ------------------------------------------------------------------------------
-- TASK 3: Design and Create Your Main Table
-- Columns:
--   1. product_id     : INT, AUTO_INCREMENT, PRIMARY KEY (Unique identifier)
--   2. product_name   : VARCHAR(100), NOT NULL (Item name)
--   3. category       : VARCHAR(50), NOT NULL (Apparel category: Tops, Dresses, etc.)
--   4. price          : DECIMAL(10,2), NOT NULL (Price in PHP)
--   5. stock_quantity : INT, NOT NULL, DEFAULT 0 (Inventory count)
--   6. description    : TEXT (Product details/materials)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS products;

CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    description TEXT
);

-- ------------------------------------------------------------------------------
-- TASK 4: INSERT: Add Sample Records (Matching Thread & Co. Catalog)
-- Inserts at least 5 records (8 actual catalog items from the app)
-- ------------------------------------------------------------------------------
INSERT INTO products (product_name, category, price, stock_quantity, description)
VALUES
    ('Basic Tee', 'Tops', 399.00, 25, 'A clean everyday tee with a relaxed modern fit.'),
    ('Ribbed Knit Top', 'Tops', 499.00, 15, 'Soft ribbed texture designed for easy layering.'),
    ('Blouse', 'Tops', 599.00, 20, 'An airy blouse that works from desk to dinner.'),
    ('Mid Dress', 'Dresses', 799.00, 10, 'A timeless midi silhouette with an effortless shape.'),
    ('Wide Leg Pants', 'Bottoms', 699.00, 18, 'Flowy wide-leg pants with an elevated everyday feel.'),
    ('Sweater', 'Tops', 699.00, 12, 'A cozy knit for cooler days and relaxed styling.'),
    ('Cardigan', 'Tops', 749.00, 14, 'A lightweight cardigan for timeless layering.'),
    ('Shoulder Bag', 'Accessories', 899.00, 8, 'Structured shoulder bag with a polished everyday shape.');

-- ------------------------------------------------------------------------------
-- TASK 5: SELECT: Retrieve and Display Records
-- Three required queries:
--   Query 1: Display all records
--   Query 2: Display selected columns
--   Query 3: Search for records that meet a condition using WHERE
-- ------------------------------------------------------------------------------

-- Query 1: Display all products
SELECT * FROM products;

-- Query 2: Display selected columns (Product ID, Name, Category, Price)
SELECT product_id, product_name, category, price, stock_quantity 
FROM products;

-- Query 3: Search for records matching a condition (All items in 'Tops' category)
SELECT * 
FROM products 
WHERE category = 'Tops';

-- ------------------------------------------------------------------------------
-- TASK 6: UPDATE: Modify Existing Records
-- Two required UPDATE queries:
--   Update 1: Modify the price of an existing product (Basic Tee, ID = 1)
--   Update 2: Restock quantity of another product (Ribbed Knit Top, ID = 2)
-- ------------------------------------------------------------------------------

-- Update 1: Change price of product_id = 1
UPDATE products
SET price = 449.00
WHERE product_id = 1;

-- Update 2: Update stock quantity of product_id = 2
UPDATE products
SET stock_quantity = 30
WHERE product_id = 2;

-- Verification: Display the modified records
SELECT product_id, product_name, price, stock_quantity
FROM products
WHERE product_id IN (1, 2);

-- ------------------------------------------------------------------------------
-- TASK 7: DELETE: Remove a Selected Record
-- Remove a discontinued product using an exact WHERE condition
-- ------------------------------------------------------------------------------

-- Step 1 & 2: Identify the record to remove
SELECT * FROM products WHERE product_id = 8;

-- Step 3: Delete product_id = 8 (Shoulder Bag) safely with WHERE clause
DELETE FROM products 
WHERE product_id = 8;

-- Step 4: Verify remaining records
SELECT * FROM products;
