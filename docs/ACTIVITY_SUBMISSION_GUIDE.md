# Step-by-Step Guide: How to Complete and Submit the Database Laboratory Activity

This guide walks you through finishing the **Database Implementation Based on Your Proposed System** laboratory activity for your project, **Thread & Co.**, and preparing a 100% complete submission.

---

## 📁 What Has Been Added to Your Project

All required database scripts and report templates have been added directly to your workspace:

1. **`database/thread_co_db.sql`**: The complete consolidated SQL script for Tasks 2 through 7.
2. **Individual task files in `database/`**:
   - `task2_create_database.sql`
   - `task3_create_table.sql`
   - `task4_insert_records.sql`
   - `task5_select_queries.sql`
   - `task6_update_queries.sql`
   - `task7_delete_query.sql`
3. **`docs/LABORATORY_REPORT_DATABASE_IMPLEMENTATION.md`**: Completed markdown report template with all answers filled in.
4. **`docs/LABORATORY_REPORT_DATABASE_IMPLEMENTATION.html`**: Formatted, printable report that you can open in Chrome/Edge, paste screenshots into, or print directly to PDF.

---

## 🚀 Steps to Execute and Finish the Activity

### Step 1: Start Apache and MySQL in XAMPP
1. Open the **XAMPP Control Panel** on your computer.
2. Next to **Apache**, click **Start**.
3. Next to **MySQL**, click **Start**.
   - *Ensure both show green status indicator.*

### Step 2: Open phpMyAdmin
1. Open your web browser (Chrome, Edge, etc.).
2. Go to: `http://localhost/phpmyadmin/`

---

### Step 3: Complete Task 2 — Create Database (15 Points)
1. In phpMyAdmin, click the **SQL** tab at the top.
2. Type or paste:
   ```sql
   CREATE DATABASE IF NOT EXISTS thread_co_db;
   ```
3. Click **Go** (bottom right).
4. Click on `thread_co_db` in the left sidebar to select it.
5. 📸 **Screenshot #1 to take:** 
   - Capture phpMyAdmin showing `thread_co_db` selected in the left navigation sidebar.

---

### Step 4: Complete Task 3 — Create Main Table (20 Points)
1. Make sure `thread_co_db` is selected.
2. Click the **SQL** tab.
3. Paste the contents of `database/task3_create_table.sql`:
   ```sql
   CREATE TABLE products (
       product_id INT AUTO_INCREMENT PRIMARY KEY,
       product_name VARCHAR(100) NOT NULL,
       category VARCHAR(50) NOT NULL,
       price DECIMAL(10, 2) NOT NULL,
       stock_quantity INT NOT NULL DEFAULT 0,
       description TEXT
   );
   ```
4. Click **Go**.
5. Click the **Structure** tab at the top.
6. 📸 **Screenshot #2 to take:**
   - Capture the **Structure** tab showing all 6 columns (`product_id`, `product_name`, `category`, `price`, `stock_quantity`, `description`), types, and the Primary Key key icon on `product_id`.

---

### Step 5: Complete Task 4 — Insert Sample Records (15 Points)
1. Click the **SQL** tab while inside `thread_co_db`.
2. Paste the contents of `database/task4_insert_records.sql`:
   ```sql
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
3. Click **Go**.
4. Click the **Browse** tab at the top.
5. 📸 **Screenshot #3 to take:**
   - Capture the **Browse** tab showing all 8 rows populated in the `products` table.

---

### Step 6: Complete Task 5 — SELECT Queries (10 Points)
Execute these 3 queries one by one in the **SQL** tab:

1. **Query 1 (Display all):**
   ```sql
   SELECT * FROM products;
   ```
   Click **Go**.
   📸 **Screenshot #4:** Capture query result showing all 8 products.

2. **Query 2 (Selected columns):**
   ```sql
   SELECT product_id, product_name, category, price, stock_quantity FROM products;
   ```
   Click **Go**.
   📸 **Screenshot #5:** Capture query result showing only those 5 columns.

3. **Query 3 (WHERE condition):**
   ```sql
   SELECT * FROM products WHERE category = 'Tops';
   ```
   Click **Go**.
   📸 **Screenshot #6:** Capture query result showing only the items where category is 'Tops'.

---

### Step 7: Complete Task 6 — UPDATE Queries (10 Points)
1. In the **SQL** tab, run:
   ```sql
   UPDATE products SET price = 449.00 WHERE product_id = 1;
   UPDATE products SET stock_quantity = 30 WHERE product_id = 2;
   ```
   Click **Go**.
2. Run the verification query:
   ```sql
   SELECT product_id, product_name, price, stock_quantity FROM products WHERE product_id IN (1, 2);
   ```
   Click **Go**.
3. 📸 **Screenshot #7:** Capture the result showing the updated price (`449.00` for ID 1) and stock (`30` for ID 2).

---

### Step 8: Complete Task 7 — DELETE Query (10 Points)
1. In the **SQL** tab, identify and delete product ID 8 (`Shoulder Bag`):
   ```sql
   DELETE FROM products WHERE product_id = 8;
   ```
   Click **Go** (confirm OK if prompted).
2. Run the verification query:
   ```sql
   SELECT * FROM products;
   ```
   Click **Go**.
3. 📸 **Screenshot #8:** Capture the remaining 7 records showing that product ID 8 is no longer present.

---

## 📝 How to Prepare and Submit Your Report

### Option A: Using Microsoft Word / Google Docs (Most Common)
1. Open Microsoft Word or Google Docs.
2. Open `docs/LABORATORY_REPORT_DATABASE_IMPLEMENTATION.md`.
3. Copy the text into Word/Docs.
4. Fill in your **Name**, **Section**, and **Date**.
5. Paste each corresponding screenshot you took in Steps 3 to 8 under the placeholder labels.
6. Click **File > Save As > PDF** (or `.docx`).
7. Upload and submit the PDF to your school's LMS (Google Classroom, Canvas, Teams, etc.).

### Option B: Using the Included HTML Report
1. Double-click `docs/LABORATORY_REPORT_DATABASE_IMPLEMENTATION.html` to open it in Chrome or Edge.
2. If you want to insert images directly, you can save your screenshots in the `docs/` folder and link them, or simply paste the HTML text into Word.
3. Click the **"Print to PDF / Save"** button at the top to generate a PDF.

---

## 💯 Grading Rubric Checklist

| Task | Criteria | Points | Status |
| :--- | :--- | :---: | :---: |
| **Task 1** | System data requirements table completed | 10 pts | ✅ Ready |
| **Task 2** | Database `thread_co_db` created in phpMyAdmin | 15 pts | ✅ SQL Ready |
| **Task 3** | Table `products` with 6 columns, PK, correct data types | 20 pts | ✅ SQL Ready |
| **Task 4** | 8 sample catalog records inserted | 15 pts | ✅ SQL Ready |
| **Task 5** | 3 SELECT queries executed (all, columns, WHERE) | 15 pts | ✅ SQL Ready |
| **Task 6** | 2 UPDATE queries executed & verified | 15 pts | ✅ SQL Ready |
| **Task 7** | 1 safe DELETE query executed with WHERE clause | 10 pts | ✅ SQL Ready |
| **Total** | | **100 pts** | |
