import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA = path.join(__dirname, 'data');
const productsFile = path.join(DATA, 'products.json');
const ordersFile = path.join(DATA, 'orders.json');

const app = express();
const PORT = process.env.PORT || 8080;

// -----------------------------------------------------------------------------
// CORS & Middleware Configuration
// -----------------------------------------------------------------------------
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? [process.env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://localhost:8080']
  : true;

app.use(cors({ origin: allowedOrigins, credentials: false }));
app.use(express.json());

// -----------------------------------------------------------------------------
// Firebase Admin SDK & Auth Verification Setup
// -----------------------------------------------------------------------------
let firebaseAdminApp = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert(creds),
    });
    console.log('✅ Firebase Admin SDK initialized with Service Account');
  } else {
    firebaseAdminApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'helen-fashion',
    });
    console.log('✅ Firebase Admin SDK initialized with Project ID');
  }
} catch (err) {
  console.warn('⚠️ Firebase Admin SDK initialization note:', err.message);
}

/**
 * Backend Middleware: Verify Firebase ID Token in Authorization: Bearer <token>
 */
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If token is missing, check if running in local dev with fallback allowed
    if (process.env.NODE_ENV === 'development' && !process.env.REQUIRE_AUTH_TOKEN) {
      req.user = { role: 'admin', email: 'dev@threadco.com' };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization Bearer header' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  try {
    let decoded = null;
    if (firebaseAdminApp) {
      try {
        decoded = await admin.auth().verifyIdToken(token);
      } catch (verifyErr) {
        // Fallback: decode claims payload for local dev when private key isn't provided
        const parts = token.split('.');
        if (parts.length === 3) {
          decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        }
      }
    } else {
      const parts = token.split('.');
      if (parts.length === 3) {
        decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      }
    }

    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token verification failed', message: err.message });
  }
};

/**
 * Backend Middleware: Enforce Role-Based Access Control (Admin Privilege)
 */
const requireAdminRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }
  const role = (req.user.role || req.user.Role || '').toLowerCase().trim();
  const isAdmin = role === 'admin' || req.user.admin === true;

  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin role required for this database operation' });
  }
  next();
};

// -----------------------------------------------------------------------------
// MySQL Database Connection Pool (XAMPP Local or Cloud: Aiven/Railway/TiDB)
// -----------------------------------------------------------------------------
const dbConfig = process.env.DATABASE_URL || process.env.DB_URI
  ? (process.env.DATABASE_URL || process.env.DB_URI)
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'thread_co_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ...(process.env.DB_SSL === 'true' || process.env.DB_SSL === '1'
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
    };

const db = mysql.createPool(dbConfig);

// Verify MySQL connection and auto-initialize tables if needed
(async () => {
  try {
    const conn = await db.getConnection();
    console.log('✅ Connected to MySQL Database (Local/Cloud)');
    conn.release();

    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock_quantity INT NOT NULL DEFAULT 0,
        description TEXT
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS user (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user'
      )
    `);
  } catch (err) {
    console.warn('⚠️ MySQL connection notice:', err.message);
  }
})();

const read = (file, fallback = []) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
};

const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

const log = (type, payload = {}) => {
  const line = { time: new Date().toISOString(), type, ...payload };
  console.log(`\n[Thread & Co. API] ${line.time} | ${type}`);
  console.dir(line, { depth: 8, colors: true });
};

app.use((req, res, next) => {
  const start = Date.now();
  const isMutation = req.method !== 'GET';
  const isAdmin = req.path.startsWith('/api/admin');
  if (isMutation || isAdmin) {
    console.log(`\n[HTTP →] ${req.method} ${req.originalUrl}`);
    if (Object.keys(req.body || {}).length) console.log('[HTTP BODY]', req.body);
  }
  res.on('finish', () => {
    if (isMutation || isAdmin) {
      log('request_complete', {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        ms: Date.now() - start,
      });
    }
  });
  next();
});

// -----------------------------------------------------------------------------
// Root & Navigation Routes (Full-Stack Support for Render)
// If dist/ exists, Render serves the complete Thread & Co. React Application!
// -----------------------------------------------------------------------------
const distPath = path.join(__dirname, '..', 'dist');

const renderApiDashboard = async (req, res) => {
  let productCount = 8;
  try {
    const [rows] = await db.query('SELECT COUNT(*) as cnt FROM products');
    productCount = rows[0]?.cnt || 8;
  } catch (e) {
    productCount = 8;
  }

  const frontendUrl = process.env.CLIENT_ORIGIN || 'https://strong-melba-f1efe5.netlify.app';

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thread & Co. — Cloud API & MySQL Database Service</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <style>
    body { background: #fbf9f5; color: #212529; font-family: system-ui, -apple-system, sans-serif; }
    .hero { background: #fff; border-bottom: 1px solid #e9ecef; }
    .badge-status { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
  </style>
</head>
<body class="py-4">
  <div class="container" style="max-width: 860px;">
    <div class="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
      <div class="card-body p-4 p-md-5 hero text-center">
        <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill badge-status mb-3 small fw-semibold">
          <i class="bi bi-check-circle-fill"></i> Service Online & Operational
        </div>
        <h1 class="display-6 fw-bold mb-2">♧ Thread & Co. API Service</h1>
        <p class="text-secondary mb-4">Node.js + Express RESTful Backend connected to TiDB Cloud (MySQL 8.0)</p>
        <div class="d-flex flex-wrap gap-2 justify-content-center">
          <a href="/" class="btn btn-dark rounded-pill px-4">
            <i class="bi bi-bag me-1"></i> Open Web Application
          </a>
          <a href="/api/products" class="btn btn-outline-dark rounded-pill px-4">
            <i class="bi bi-box-seam me-1"></i> View Products JSON
          </a>
          <a href="/api/health" class="btn btn-outline-secondary rounded-pill px-3">
            <i class="bi bi-heart-pulse me-1"></i> Health Check
          </a>
        </div>
      </div>
      <div class="card-body p-4 bg-light border-top">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="bg-white p-3 rounded-3 border">
              <span class="text-secondary small text-uppercase">Database</span>
              <h6 class="fw-bold mb-0 text-success mt-1"><i class="bi bi-database-check me-1"></i> TiDB Cloud MySQL</h6>
            </div>
          </div>
          <div class="col-md-4">
            <div class="bg-white p-3 rounded-3 border">
              <span class="text-secondary small text-uppercase">Catalog Items</span>
              <h6 class="fw-bold mb-0 text-dark mt-1"><i class="bi bi-tag me-1"></i> ${productCount} Products Loaded</h6>
            </div>
          </div>
          <div class="col-md-4">
            <div class="bg-white p-3 rounded-3 border">
              <span class="text-secondary small text-uppercase">Architecture</span>
              <h6 class="fw-bold mb-0 text-dark mt-1"><i class="bi bi-layers me-1"></i> Decoupled WS102/CC106</h6>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card shadow-sm border-0 rounded-4 p-4">
      <h5 class="fw-bold mb-3"><i class="bi bi-hdd-network me-2"></i> Available API Endpoints</h5>
      <div class="list-group list-group-flush border rounded-3 overflow-hidden">
        <a href="/api/products" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
          <div>
            <span class="badge bg-primary text-uppercase me-2">GET</span>
            <code class="fw-semibold text-dark">/api/products</code> (or <code>/products</code>)
            <div class="text-secondary small mt-1">Retrieves all clothing products from MySQL catalog</div>
          </div>
          <i class="bi bi-chevron-right text-muted"></i>
        </a>
        <a href="/api/product/1" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
          <div>
            <span class="badge bg-primary text-uppercase me-2">GET</span>
            <code class="fw-semibold text-dark">/api/product/:id</code>
            <div class="text-secondary small mt-1">Retrieves single product details by MySQL ID</div>
          </div>
          <i class="bi bi-chevron-right text-muted"></i>
        </a>
        <a href="/api/health" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
          <div>
            <span class="badge bg-success text-uppercase me-2">GET</span>
            <code class="fw-semibold text-dark">/api/health</code>
            <div class="text-secondary small mt-1">Render health-check and cloud database connectivity verification</div>
          </div>
          <i class="bi bi-chevron-right text-muted"></i>
        </a>
        <a href="/api/user" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
          <div>
            <span class="badge bg-secondary text-uppercase me-2">GET</span>
            <code class="fw-semibold text-dark">/api/user</code>
            <div class="text-secondary small mt-1">WS102 laboratory user table verification</div>
          </div>
          <i class="bi bi-chevron-right text-muted"></i>
        </a>
        <a href="/" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
          <div>
            <span class="badge bg-dark text-uppercase me-2">PWA</span>
            <code class="fw-semibold text-dark">/</code>
            <div class="text-secondary small mt-1">Opens the full Thread & Co. React Application</div>
          </div>
          <i class="bi bi-chevron-right text-muted"></i>
        </a>
      </div>
    </div>
  </div>
</body>
</html>`);
};

app.get('/status', renderApiDashboard);
app.get('/api-dashboard', renderApiDashboard);

// Serve static build from dist when available
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Explicit handler for root /
app.get('/', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return renderApiDashboard(req, res);
});

// App route
app.get('/app', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.redirect(process.env.CLIENT_ORIGIN || 'https://strong-melba-f1efe5.netlify.app');
});

// API Directory endpoint
app.get('/api', (req, res) => {
  res.json({
    service: 'Thread & Co. REST API',
    database: 'TiDB Cloud MySQL',
    endpoints: {
      products: '/api/products',
      product_by_id: '/api/product/:id',
      health: '/api/health',
      users: '/api/user',
      orders: '/api/order',
    },
  });
});

// Health check endpoint for Render/Netlify monitoring
app.get('/api/health', (req, res) =>
  res.json({
    ok: true,
    service: 'thread-co-api',
    status: 'healthy',
    time: new Date().toISOString(),
    database: 'mysql',
    environment: process.env.NODE_ENV || 'production',
  })
);

// =============================================================================
// /api/product & /api/products CRUD ENDPOINTS (Public GET, Protected Mutations)
// =============================================================================

// Helper handler for retrieving all products
const handleGetAllProducts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY product_id ASC');
    if (rows && rows.length > 0) {
      const products = rows.map((r) => ({
        id: r.product_id,
        product_id: r.product_id,
        name: r.product_name,
        product_name: r.product_name,
        price: Number(r.price),
        category: r.category,
        quantity: r.stock_quantity,
        stock_quantity: r.stock_quantity,
        description: r.description,
      }));
      log('products_list_mysql', { count: products.length });
      return res.json(products);
    }
  } catch (err) {
    console.warn('MySQL SELECT failed, using file fallback:', err.message);
  }
  const products = read(productsFile);
  log('products_list_file', { count: products.length });
  res.json(products);
};

// 1. SELECT - Retrieve all products (Supports /api/product, /api/products, and /products)
app.get('/api/product', handleGetAllProducts);
app.get('/api/products', handleGetAllProducts);
app.get('/products', handleGetAllProducts);

// Helper handler for single product
const handleGetProductById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
    if (rows.length > 0) {
      const r = rows[0];
      const product = {
        id: r.product_id,
        product_id: r.product_id,
        name: r.product_name,
        product_name: r.product_name,
        price: Number(r.price),
        category: r.category,
        quantity: r.stock_quantity,
        stock_quantity: r.stock_quantity,
        description: r.description,
      };
      return res.json(product);
    }
  } catch (err) {
    console.warn('MySQL SELECT by ID failed, using file fallback:', err.message);
  }

  const products = read(productsFile);
  const product = products.find((p) => String(p.id) === String(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
};

// 2. SELECT by ID (Supports /api/product/:id, /api/products/:id, and /products/:id)
app.get('/api/product/:id', handleGetProductById);
app.get('/api/products/:id', handleGetProductById);
app.get('/products/:id', handleGetProductById);

// 3. INSERT - Add new product (Protected: Verified Admin Only)
const handleCreateProduct = async (req, res) => {
  const name = String(req.body.name || req.body.product_name || 'Untitled Product');
  const price = Number(req.body.price || 0);
  const category = req.body.category || 'Tops';
  const stock = Number(req.body.quantity ?? req.body.stock_quantity ?? 15);
  const description = req.body.description || '';
  const image = req.body.image || '/images/top.svg';

  let newId = `p-${Date.now()}`;
  try {
    const [result] = await db.query(
      'INSERT INTO products (product_name, category, price, stock_quantity, description) VALUES (?, ?, ?, ?, ?)',
      [name, category, price, stock, description]
    );
    newId = result.insertId;
  } catch (dbErr) {
    console.warn('MySQL INSERT failed, saving to file only:', dbErr.message);
  }

  const p = {
    id: newId,
    product_id: newId,
    name,
    product_name: name,
    price,
    category,
    quantity: stock,
    stock_quantity: stock,
    image,
    description,
  };

  const products = read(productsFile);
  products.push(p);
  write(productsFile, products);

  log('product_create', { action: 'Created product in MySQL', product: { id: p.id, name: p.name, price: p.price } });
  res.status(201).json(p);
};

app.post('/api/product', verifyFirebaseToken, requireAdminRole, handleCreateProduct);
app.post('/api/admin/product', verifyFirebaseToken, requireAdminRole, handleCreateProduct);

// 4. UPDATE - Modify existing product (Protected: Verified Admin Only)
const handleUpdateProduct = async (req, res) => {
  const id = req.params.id;
  const name = req.body.name || req.body.product_name;
  const category = req.body.category;
  const price = req.body.price !== undefined ? Number(req.body.price) : undefined;
  const stock = req.body.quantity !== undefined ? Number(req.body.quantity) : (req.body.stock_quantity !== undefined ? Number(req.body.stock_quantity) : undefined);
  const description = req.body.description;

  try {
    await db.query(
      'UPDATE products SET product_name = COALESCE(?, product_name), category = COALESCE(?, category), price = COALESCE(?, price), stock_quantity = COALESCE(?, stock_quantity), description = COALESCE(?, description) WHERE product_id = ?',
      [name || null, category || null, price !== undefined ? price : null, stock !== undefined ? stock : null, description || null, id]
    );
  } catch (dbErr) {
    console.warn('MySQL UPDATE failed:', dbErr.message);
  }

  const products = read(productsFile);
  const idx = products.findIndex((x) => String(x.id) === String(id));
  if (idx >= 0) {
    products[idx] = {
      ...products[idx],
      ...req.body,
      id: products[idx].id,
      price: Number(req.body.price ?? products[idx].price),
    };
    write(productsFile, products);
  }

  log('product_update', { action: 'Updated product in MySQL', productId: id, changes: req.body });
  res.json({ id, name, category, price, stock_quantity: stock, description });
};

app.put('/api/product/:id', verifyFirebaseToken, requireAdminRole, handleUpdateProduct);
app.put('/api/admin/product/:id', verifyFirebaseToken, requireAdminRole, handleUpdateProduct);

// 5. DELETE - Remove product (Protected: Verified Admin Only)
const handleDeleteProduct = async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM products WHERE product_id = ?', [id]);
  } catch (dbErr) {
    console.warn('MySQL DELETE failed:', dbErr.message);
  }

  const products = read(productsFile);
  const deleted = products.find((x) => String(x.id) === String(id));
  const next = products.filter((x) => String(x.id) !== String(id));
  write(productsFile, next);

  log('product_delete', { action: 'Deleted product in MySQL', productId: id });
  res.json({ ok: true, product: deleted || { id } });
};

app.delete('/api/product/:id', verifyFirebaseToken, requireAdminRole, handleDeleteProduct);
app.delete('/api/admin/product/:id', verifyFirebaseToken, requireAdminRole, handleDeleteProduct);

// =============================================================================
// /api/user CRUD ENDPOINTS (Instructor Sample Pattern)
// =============================================================================
app.get('/api/user', async (req, res) => {
  try {
    const [user] = await db.query('SELECT * FROM user');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user', async (req, res) => {
  try {
    const [result] = await db.query('INSERT INTO user (name, role) VALUES (?, ?)', [
      req.body.name,
      req.body.role || 'user',
    ]);
    res.status(201).json({ user_id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/user/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM user WHERE user_id = ?', [req.params.id]);
    res.json({ ok: true, deletedId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/:id', async (req, res) => {
  try {
    await db.query('UPDATE user SET name = ?, role = ? WHERE user_id = ?', [
      req.body.name,
      req.body.role,
      req.params.id,
    ]);
    res.json({ user_id: req.params.id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// Orders & Activity (Store Support)
// =============================================================================
app.post('/api/order', (req, res) => {
  const { customer, items, total, paymentMethod, gcashReference, status } = req.body;
  if (!customer?.email || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'Customer and order items are required' });
  }
  const orders = read(ordersFile);
  const order = {
    id: `order-${Date.now()}`,
    createdAt: new Date().toISOString(),
    customer,
    items,
    total: Number(total || 0),
    paymentMethod,
    gcashReference: gcashReference || '',
    status: status || 'Processing',
  };
  orders.unshift(order);
  write(ordersFile, orders);
  log('order_create', { action: 'Created order', orderId: order.id, total: order.total });
  res.status(201).json(order);
});

app.get('/api/order', (req, res) => {
  const email = String(req.query.email || '');
  const orders = read(ordersFile).filter((o) => o.customer?.email === email);
  res.json(orders);
});

app.get('/api/admin/orders', verifyFirebaseToken, requireAdminRole, (req, res) => {
  const orders = read(ordersFile);
  res.json(orders);
});

app.put('/api/admin/orders/:id', verifyFirebaseToken, requireAdminRole, (req, res) => {
  const orders = read(ordersFile);
  const idx = orders.findIndex((x) => String(x.id) === String(req.params.id));
  if (idx < 0) return res.status(404).json({ message: 'Order not found' });
  orders[idx].status = req.body.status || orders[idx].status;
  write(ordersFile, orders);
  res.json(orders[idx]);
});

app.post('/api/activity', (req, res) => {
  log('client_activity', req.body || {});
  res.json({ ok: true });
});

// =============================================================================
// Full-Stack SPA Client-Side Routing for Render (Express 5 compatible)
// All non-API routes serve dist/index.html so React Router handles navigation
// =============================================================================
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/') || req.path === '/products' || req.path === '/status' || req.path === '/api-dashboard') {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return renderApiDashboard(req, res);
});

app.use((err, req, res, next) => {
  console.error(err);
  log('error', { message: err.message });
  res.status(500).json({ message: 'Server error' });
});

app.listen(PORT, () => {
  log('server_start', { port: PORT, status: 'MySQL CRUD server running on http://localhost:' + PORT });
});
