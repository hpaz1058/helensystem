# WS102: WEB SYSTEMS AND TECHNOLOGIES
## LABORATORY SUBMISSION REPORT
### Full Backend MySQL CRUD Database Integration using Express.js (mysql2/promise)
**System:** Thread & Co. (E-Commerce Web Application)  
**Date Submitted:** November 6, 2026  

---

### Student Information
- **Student Name:** `[Your Full Name Here]`
- **Course & Section:** `BSIT - WS102 (Web Systems)`
- **Instructor / Professor:** `[Instructor's Name]`
- **Shareable Screen Recording Link:** `[Paste Google Drive / Loom / YouTube Unlisted link here]`
- **System Name:** Thread & Co. (E-Commerce Clothing & Apparel Management System)

---

## I. Activity Objectives
1. Integrate a local MySQL database via XAMPP (phpMyAdmin) into an existing Express.js web application.
2. Establish an asynchronous connection pool using the `mysql2/promise` library for efficient query execution.
3. Implement complete CRUD (Create, Read, Update, Delete) endpoints connected to the `/api/product` route.
4. Synchronize the React user interface with the MySQL database in real time, preventing UI desynchronization.
5. Verify all four operations with live side-by-side evidence comparing the client UI and phpMyAdmin records.

---

## II. System Architecture & Integration Overview

The application, **Thread & Co.**, is a full-stack e-commerce clothing and apparel system. The architecture consists of three interconnected layers:
1. **Client-Side Presentation Layer (React + Vite PWA):** Provides an interactive interface for both shoppers and store administrators, allowing live catalog viewing, item management, and cart operations.
2. **Application Server Layer (Express.js):** Serves RESTful API endpoints at `/api/product`, processing incoming HTTP requests (`GET`, `POST`, `PUT`, `DELETE`) and returning structured JSON payloads.
3. **Database Layer (MySQL / phpMyAdmin via XAMPP):** Stores relational apparel data inside the `thread_co_db` database under the `products` table, maintaining ACID compliance and persistent state.

---

## III. Database Schema & Table Structure

- **Database Name:** `thread_co_db`
- **Main Table:** `products`
- **Primary Key:** `product_id` (Auto-incrementing integer)

### Table Structure Specification:

| Column Name | Data Type | Null / Default | Key | Description & Purpose |
| :--- | :--- | :--- | :---: | :--- |
| **`product_id`** | `INT` | `NOT NULL, AUTO_INCREMENT` | **`PRIMARY KEY`** | Unique auto-generated identifier for each clothing item |
| **`product_name`** | `VARCHAR(100)` | `NOT NULL` | | Title / Name of the apparel product |
| **`category`** | `VARCHAR(50)` | `NOT NULL` | | Apparel category (Tops, Dresses, Bottoms, Accessories) |
| **`price`** | `DECIMAL(10,2)` | `NOT NULL` | | Selling price in Philippine Pesos (₱) |
| **`stock_quantity`** | `INT` | `NOT NULL, DEFAULT 0` | | Available inventory units in stock |
| **`description`** | `TEXT` | `NULL` | | Material, sizing, and styling specifications |

### SQL DDL Statement:
```sql
CREATE DATABASE IF NOT EXISTS thread_co_db;
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

---

## IV. Backend Express.js Implementation (`mysql2/promise`)

The backend script below connects to MySQL using a connection pool, providing all four CRUD routes on `/api/product` using parameterized queries to prevent SQL injection vulnerabilities:

```javascript
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// 1. MySQL Connection Pool Configuration (phpMyAdmin / XAMPP)
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'thread_co_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test initial database connection
db.getConnection()
    .then(() => console.log('✅ Connected to MySQL Database (thread_co_db)'))
    .catch(err => console.error('❌ Database Connection Failed:', err.message));

// 2. READ (SELECT) — Retrieve all products
app.get('/api/product', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products ORDER BY product_id DESC');
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. CREATE (INSERT) — Add new product record
app.post('/api/product', async (req, res) => {
    try {
        const { product_name, category, price, stock_quantity, description } = req.body;
        const [result] = await db.query(
            'INSERT INTO products (product_name, category, price, stock_quantity, description) VALUES (?, ?, ?, ?, ?)',
            [product_name, category, price, stock_quantity || 0, description || '']
        );
        res.status(201).json({
            message: 'Product inserted successfully',
            product_id: result.insertId,
            ...req.body
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. UPDATE — Modify existing product record
app.put('/api/product/:id', async (req, res) => {
    try {
        const { product_name, category, price, stock_quantity, description } = req.body;
        await db.query(
            'UPDATE products SET product_name = ?, category = ?, price = ?, stock_quantity = ?, description = ? WHERE product_id = ?',
            [product_name, category, price, stock_quantity, description, req.params.id]
        );
        res.json({ message: 'Product updated successfully', product_id: req.params.id, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. DELETE — Remove product record
app.delete('/api/product/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE product_id = ?', [req.params.id]);
        res.json({ message: 'Product deleted successfully', product_id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
```

---

## V. Live CRUD Operations & Side-by-Side phpMyAdmin Verification

### 1. Operation: READ / SELECT (Display Catalog Records)
- **Endpoint:** `GET /api/product`
- **Exact SQL Query:**
  ```sql
  SELECT * FROM products ORDER BY product_id DESC;
  ```
- **Description:** When the store interface loads, the frontend initiates a `GET` request to `/api/product`. The Express handler executes the SELECT query across the `products` table in MySQL and returns the catalog array, populating the product grid in the UI.

| Application User Interface (UI) | phpMyAdmin (Database Verification) |
| :---: | :---: |
| `[ SCREENSHOT: UI showing product cards with titles, prices, and categories ]` | `[ SCREENSHOT: phpMyAdmin Browse tab showing matching table records ]` |

> **Figure 1:** *Side-by-side verification of the SELECT operation showing identical catalog records displayed on the UI and stored in MySQL.*

---

### 2. Operation: CREATE / INSERT (Add New Product)
- **Endpoint:** `POST /api/product`
- **Exact SQL Query:**
  ```sql
  INSERT INTO products (product_name, category, price, stock_quantity, description) 
  VALUES (?, ?, ?, ?, ?);
  ```
- **Description:** An administrator completes and submits the "Add Product" form in the dashboard. The server executes a parameterized INSERT query, generating a new primary key `product_id` and storing the apparel item. The frontend receives the response and immediately appends the new product to the catalog view.

| Application User Interface (UI) | phpMyAdmin (Database Verification) |
| :---: | :---: |
| `[ SCREENSHOT: Admin UI showing form submission / new product appearing ]` | `[ SCREENSHOT: phpMyAdmin Browse tab showing the new row inserted with ID ]` |

> **Figure 2:** *Side-by-side verification of the INSERT operation showing instant record insertion in phpMyAdmin upon form submission.*

---

### 3. Operation: UPDATE (Modify Existing Record)
- **Endpoint:** `PUT /api/product/:id`
- **Exact SQL Query:**
  ```sql
  UPDATE products 
  SET product_name = ?, category = ?, price = ?, stock_quantity = ?, description = ? 
  WHERE product_id = ?;
  ```
- **Description:** An administrator modifies the price (e.g., from ₱399 to ₱449) and inventory stock for an existing item (`product_id = 1`). The PUT request applies the changes to MySQL using a strict `WHERE product_id = ?` clause, safely modifying only the targeted record.

| Application User Interface (UI) | phpMyAdmin (Database Verification) |
| :---: | :---: |
| `[ SCREENSHOT: UI modal showing updated price/stock and success notice ]` | `[ SCREENSHOT: phpMyAdmin showing the updated row values in products table ]` |

> **Figure 3:** *Side-by-side verification of the UPDATE operation confirming real-time database modification without altering unintended rows.*

---

### 4. Operation: DELETE (Remove Product Record)
- **Endpoint:** `DELETE /api/product/:id`
- **Exact SQL Query:**
  ```sql
  DELETE FROM products 
  WHERE product_id = ?;
  ```
- **Description:** An administrator triggers product deletion from the catalog. After user confirmation in the UI modal, a `DELETE` request is sent with the target `product_id`. The server deletes the row from the database and the UI removes the item card in real time.

| Application User Interface (UI) | phpMyAdmin (Database Verification) |
| :---: | :---: |
| `[ SCREENSHOT: UI confirmation dialog and card being removed from UI ]` | `[ SCREENSHOT: phpMyAdmin Browse tab showing the record count reduced by 1 ]` |

> **Figure 4:** *Side-by-side verification of the DELETE operation showing precise row removal while safeguarding the rest of the database.*

---

## VI. Screen Recording Demonstration Details

As required by the assignment guidelines, a full video demonstration showing all four CRUD operations executing live side-by-side with phpMyAdmin has been recorded and uploaded:

- **Shareable Video Link:** `[ PASTE YOUR GOOGLE DRIVE / LOOM / YOUTUBE UNLISTED LINK HERE ]`

### Video Demonstration Timestamps:
- **`0:00`** — Introduction, System Overview, and Database Connection Verification in Terminal
- **`0:35`** — Live READ / SELECT Demonstration: Browser UI catalog population from phpMyAdmin records
- **`1:15`** — Live CREATE / INSERT Demonstration: Submitting new clothing product form & seeing row appear in phpMyAdmin
- **`2:00`** — Live UPDATE Demonstration: Modifying price & stock in Admin UI and observing instant update in MySQL
- **`2:45`** — Live DELETE Demonstration: Deleting an item with confirmation modal & verifying table deletion in phpMyAdmin
- **`3:20`** — Conclusion and Summary of Real-Time Data Synchronization

---

## VII. Conclusion & Technical Insights

Through this laboratory exercise, the integration between an Express.js backend and a MySQL relational database via `mysql2/promise` was successfully completed for **Thread & Co.**. Key technical takeaways include:
1. **Connection Pooling:** Utilizing `mysql.createPool()` provided non-blocking, scalable database connection management rather than repeatedly opening and terminating single connections.
2. **Parameterized Queries:** All SQL statements utilized placeholder parameters (`?`), ensuring robust defense against SQL injection attacks.
3. **Real-Time State Synchronization:** Coordinating frontend state management with asynchronous REST endpoints ensured that client views immediately reflect database mutations, satisfying all assignment requirements.
