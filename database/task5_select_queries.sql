-- Task 5: SELECT - Retrieve and Display Records
USE thread_co_db;

-- 1. Display all records
SELECT * FROM products;

-- 2. Display selected columns
SELECT product_id, product_name, category, price, stock_quantity 
FROM products;

-- 3. Search for records that meet a condition using WHERE
SELECT * 
FROM products 
WHERE category = 'Tops';
