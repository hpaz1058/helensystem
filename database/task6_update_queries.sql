-- Task 6: UPDATE - Modify Existing Records
USE thread_co_db;

-- 1. Modify the price of product_id = 1 (Basic Tee)
UPDATE products
SET price = 449.00
WHERE product_id = 1;

-- 2. Modify the stock quantity of product_id = 2 (Ribbed Knit Top)
UPDATE products
SET stock_quantity = 30
WHERE product_id = 2;

-- 3. Run SELECT query to verify the changes
SELECT product_id, product_name, price, stock_quantity
FROM products
WHERE product_id IN (1, 2);
