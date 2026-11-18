# LABORATORY ACTIVITY REPORT
## Database Implementation Based on Your Proposed System
**Course / Subject:** Application Development / Database Management Systems  
**Topic:** MySQL CRUD Operations with phpMyAdmin  
**Total Points:** 100 Points  

---

### Student Information
- **Student Name:** `[Your Name Here]`
- **Section / Year:** `[Your Section Here, e.g., BSIT 3-A]`
- **Date Submitted:** `[Date Here, e.g., October 24, 2026]`
- **Instructor / Professor:** `[Instructor's Name]`

---

## Task 1 — Identify Your System’s Data Requirements (10 Points)

| Requirement | Your Answer |
| :--- | :--- |
| **System Name** | **Thread & Co.** (E-Commerce Clothing & Apparel Management System) |
| **Purpose of the System** | To provide an online fashion shopping platform where customers can browse, filter, and order modern wardrobe essentials, and administrators can manage catalog inventory, pricing, and orders. |
| **Main Information to be Stored** | Product catalog information (product name, category, pricing, available stock quantity, and descriptions). |
| **Proposed Database Name** | `thread_co_db` |
| **Main Table Name** | `products` |
| **At Least Five Columns Needed** | `product_id`, `product_name`, `category`, `price`, `stock_quantity`, `description` |

---

## Task 2 — Create Your Database in phpMyAdmin (15 Points)

### SQL Statement:
```sql
CREATE DATABASE thread_co_db;
```

### Steps Executed:
1. Launched **XAMPP Control Panel** and clicked **Start** for both **Apache** and **MySQL**.
2. Opened web browser and navigated to `http://localhost/phpmyadmin/`.
3. Navigated to the **SQL** tab (or clicked **New** in the navigation panel).
4. Executed `CREATE DATABASE thread_co_db;`.
5. Selected `thread_co_db` from the left sidebar database list.

### Evidence / Screenshot:
> *Insert screenshot below showing `thread_co_db` created and visible in phpMyAdmin:*

```
[ SCREENSHOT PLACEHOLDER: phpMyAdmin showing the created "thread_co_db" database in the left sidebar ]
```

---

## Task 3 — Design and Create Your Main Table (20 Points)

### Table Schema Design:
- **Table Name:** `products`
- **Primary Key:** `product_id` (Auto-incrementing integer for unique identification)
- **Columns Specification:**
  - `product_id` : `INT AUTO_INCREMENT PRIMARY KEY` — Unique ID for each clothing item.
  - `product_name` : `VARCHAR(100) NOT NULL` — Name or title of the product.
  - `category` : `VARCHAR(50) NOT NULL` — Category classification (e.g., Tops, Dresses, Bottoms, Accessories).
  - `price` : `DECIMAL(10,2) NOT NULL` — Selling price in Philippine Pesos (PHP).
  - `stock_quantity` : `INT NOT NULL DEFAULT 0` — Available units in stock.
  - `description` : `TEXT` — Detailed overview of clothing material, fit, and styling notes.

### SQL Statement:
```sql
USE thread_co_db;

CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    description TEXT
);
```

### Evidence / Screenshot:
> *Insert screenshot below showing the table structure under the **Structure** tab in phpMyAdmin (showing fields, types, and Primary Key icon):*

```
[ SCREENSHOT PLACEHOLDER: phpMyAdmin "Structure" tab showing the columns, types, NULL, and PRIMARY KEY ]
```

---

## Task 4 — INSERT: Add Sample Records (15 Points)

Sample records based on the actual live product catalog of **Thread & Co.**:

### SQL Statement:
```sql
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
```

### Evidence / Screenshot:
> *Insert screenshot below showing at least 5 inserted records visible in phpMyAdmin under the **Browse** tab:*

```
[ SCREENSHOT PLACEHOLDER: phpMyAdmin "Browse" tab displaying the 8 inserted product records in the products table ]
```

---

## Task 5 — SELECT: Retrieve and Display Records (10 Points)

### Query 1: Display All Records
**Purpose:** Retrieves all columns and all product rows from the database.
```sql
SELECT * FROM products;
```
> *Screenshot of Query 1 results:*
```
[ SCREENSHOT PLACEHOLDER: SQL execution result showing all 8 rows returned ]
```

---

### Query 2: Display Selected Columns
**Purpose:** Projects only the essential product identification, categorization, pricing, and stock fields.
```sql
SELECT product_id, product_name, category, price, stock_quantity 
FROM products;
```
> *Screenshot of Query 2 results:*
```
[ SCREENSHOT PLACEHOLDER: SQL execution result showing only product_id, product_name, category, price, stock_quantity ]
```

---

### Query 3: Search for Records Meeting a Condition Using WHERE
**Purpose:** Filters and retrieves only apparel products belonging to the `'Tops'` category.
```sql
SELECT * 
FROM products 
WHERE category = 'Tops';
```
> *Screenshot of Query 3 results:*
```
[ SCREENSHOT PLACEHOLDER: SQL execution result showing the 5 items filtered by WHERE category = 'Tops' ]
```

---

## Task 6 — UPDATE: Modify Existing Records (10 Points)

### Update Operation 1: Price Adjustment
**Target:** Product ID 1 (`Basic Tee`)  
**Modification:** Change `price` from `399.00` to `449.00`.
```sql
UPDATE products
SET price = 449.00
WHERE product_id = 1;
```

### Update Operation 2: Stock Replenishment
**Target:** Product ID 2 (`Ribbed Knit Top`)  
**Modification:** Update `stock_quantity` from `15` to `30`.
```sql
UPDATE products
SET stock_quantity = 30
WHERE product_id = 2;
```

### Verification Query:
```sql
SELECT product_id, product_name, price, stock_quantity
FROM products
WHERE product_id IN (1, 2);
```

### Evidence / Screenshot:
> *Insert screenshot below showing the successful update message and the verification SELECT result reflecting the updated values:*

```
[ SCREENSHOT PLACEHOLDER: phpMyAdmin showing "2 rows affected" and SELECT output verifying price = 449.00 and stock_quantity = 30 ]
```

---

## Task 7 — DELETE: Remove a Selected Record (10 Points)

### Step 1 & 2: Identify Record to Remove
**Target Record:** Product ID 8 (`Shoulder Bag` - discontinued item)
```sql
SELECT * FROM products WHERE product_id = 8;
```

### Step 3: Execute Safe DELETE with WHERE Condition
*(Safety Requirement Adhered To: A specific `WHERE product_id = 8` clause is used to prevent unintentional table truncation)*
```sql
DELETE FROM products 
WHERE product_id = 8;
```

### Step 4: Verification of Remaining Records
```sql
SELECT * FROM products;
```

### Evidence / Screenshot:
> *Insert screenshot below showing the successful DELETE query execution and the remaining 7 records (ID 8 removed):*

```
[ SCREENSHOT PLACEHOLDER: phpMyAdmin showing "1 row affected" and the Browse tab showing remaining records with ID 8 deleted ]
```

---

## Summary & Verification Checklist

- [x] **Task 1 (10 pts):** System requirements and data model identified for **Thread & Co.**
- [x] **Task 2 (15 pts):** `thread_co_db` database created in phpMyAdmin.
- [x] **Task 3 (20 pts):** `products` table designed with Primary Key, auto-increment, and suitable types.
- [x] **Task 4 (15 pts):** 8 relevant product records inserted into `products`.
- [x] **Task 5 (10 pts):** 3 distinct SELECT queries executed (all rows, specific columns, WHERE filter).
- [x] **Task 6 (10 pts):** 2 UPDATE operations performed and verified.
- [x] **Task 7 (10 pts):** 1 DELETE operation safely executed using WHERE condition and verified.
- [x] **Report Requirements (10 pts):** System description, full SQL commands, and screenshots included.

**Total Score: 100 / 100**
