-- Task 7: DELETE - Remove a Selected Record
USE thread_co_db;

-- 1. Identify the record to remove
SELECT * FROM products WHERE product_id = 8;

-- 2. Execute DELETE using an appropriate WHERE condition (Remove discontinued Shoulder Bag)
DELETE FROM products 
WHERE product_id = 8;

-- 3. Run SELECT again to verify that the record no longer exists
SELECT * FROM products;
