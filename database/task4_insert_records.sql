-- Task 4: INSERT Sample Records
USE thread_co_db;

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
