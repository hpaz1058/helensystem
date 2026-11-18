# Thread & Co. — E-Commerce Progressive Web App (PWA)

[![Netlify Status](https://api.netlify.com/api/v1/badges/e89195ba-314a-4e70-8b76-fe27ff36ef6a/deploy-status)](https://app.netlify.com/projects/strong-melba-f1efe5)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node: Express](https://img.shields.io/badge/Node.js-Express%205-green.svg)](https://expressjs.com/)
[![React: 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![MySQL: 8.0+](https://img.shields.io/badge/MySQL-CRUD-orange.svg)](https://www.mysql.com/)

A modern, responsive e-commerce web application for contemporary wardrobe essentials engineered with **React 19**, **Bootstrap 5**, **Node.js / Express**, **MySQL (mysql2/promise)**, and **Firebase Authentication & Firestore RBAC**, designed to meet all academic and technical requirements for **WS102 (Web Systems & Technologies)** and **CC106 (Application Development & Emerging Technologies)**.

---

## 🌐 Live Production URLs

| Component | Production URL | Description |
| :--- | :--- | :--- |
| **Frontend PWA (Netlify)** | [https://strong-melba-f1efe5.netlify.app](https://strong-melba-f1efe5.netlify.app) | Production Progressive Web App deployed on Netlify with HTTPS and continuous deployment via GitHub. |
| **Backend API (Render)** | `https://<render-service-name>.onrender.com/api/health` | Node.js Express REST API web service with health monitoring. |
| **Local Development API** | `http://localhost:8080/api/health` | Express server running locally with XAMPP MySQL. |

---

## 🏗️ System Architecture & Tech Stack (WS102 Core)

The application follows a decoupled client-server architecture:

```
[ React 19 + Bootstrap 5 PWA ]  <-- HTTPS / WSS -->  [ Node.js / Express API ]
       │                                                      │
  Firebase Auth & Firestore                             mysql2/promise Pool
  (OAuth 2.0 & RBAC Store)                                    │
                                                      [ MySQL Database ]
                                              (XAMPP localhost / Cloud MySQL)
```

- **Frontend:** React 19 (Functional Components, Hooks, Context), React Router v7, Bootstrap 5 + Bootstrap Icons.
- **Backend:** Node.js with Express 5 RESTful API, CORS middleware, JSON body parsing, Firebase Admin ID token verification, and error handlers.
- **Database:** MySQL relational database (`thread_co_db`) implementing full CRUD operations (`products` and `user` tables).
- **CRUD Endpoints (`/api/product`):**
  - `GET /api/product` — SELECT: Retrieve full product catalog.
  - `GET /api/product/:id` — SELECT: Retrieve single product details.
  - `POST /api/product` — INSERT: Add new product (Admin authenticated).
  - `PUT /api/product/:id` — UPDATE: Modify product attributes (Admin authenticated).
  - `DELETE /api/product/:id` — DELETE: Remove product from database (Admin authenticated).

---

## 📱 Progressive Web App (PWA) Capabilities (CC106 Core)

- **Web App Manifest (`manifest.webmanifest` & `manifest.json`):**
  - Configures `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `background_color: "#f8f4ee"`, and `theme_color: "#f3e9dc"`.
  - Includes standard and maskable app icons in both `192x192` and `512x512` resolutions.
  - Installable across Desktop (Chrome, Edge) and Mobile (Android, iOS).
- **Service Worker & Caching Strategies (Workbox / VitePWA):**
  - **App Shell & Static Assets:** Cached with `CacheFirst` for high-resolution images (`thread-images-v2`) and `NetworkFirst` (`thread-static-v4`) for styles and scripts.
  - **Dynamic API Caching:** `NetworkFirst` strategy for Express API GET requests (`thread-api-cache-v1`) with 24-hour expiration, allowing users to view product catalogs offline.
  - **Offline Fallback UI:** Dedicated `offline.html` page and an interactive offline status notification banner when network connectivity drops.

---

## 🔐 Authentication, Authorization & Routing (CC106 Core)

- **Firebase Authentication:**
  - Google Sign-In (OAuth 2.0) as primary authentication method.
  - Email & Password registration and login supported.
- **Role-Based Access Control (RBAC):**
  - Roles (`admin` vs. `user`) stored and managed in Cloud Firestore (`users/{uid}`).
  - **Frontend RBAC:** Dynamic navigation rendering and `<ProtectedRoute requiredRole="admin">` wrapper guarding `/admin`. Non-admin users attempting direct navigation are redirected to `/access-denied` (403).
  - **Backend RBAC Middleware:** `verifyFirebaseToken` and `requireAdminRole` validate the incoming Firebase ID token in the `Authorization: Bearer <token>` header before executing privileged mutations.
- **Client-Side Routing (`react-router-dom`):**
  - `/` — Landing / Home
  - `/shop` & `/product/:id` — Product Catalog & Details
  - `/login` — Authentication view
  - `/profile` — User profile, UID, email, provider, role badge
  - `/orders` & `/checkout` — Customer purchasing and order tracking
  - `/admin` — Protected Admin Dashboard & MySQL CRUD management
  - `/access-denied` — Custom 403 Forbidden page
  - `*` — Custom 404 Not Found page

---

## 📁 Project Directory Structure

```text
├── backend/
│   ├── data/                 # JSON file fallback data & activity logs
│   └── server.js             # Express API, MySQL connection pool, Firebase Auth middleware
├── database/
│   ├── task2_create_database.sql
│   ├── task3_create_table.sql
│   ├── task4_insert_records.sql
│   ├── task5_select_queries.sql
│   ├── task6_update_queries.sql
│   ├── task7_delete_query.sql
│   └── thread_co_db.sql      # Full database schema and seed data
├── docs/                     # Laboratory reports & submission guides
├── public/
│   ├── icons/                # 192x192 and 512x512 PNG/SVG PWA icons
│   ├── images/               # Product images and branding assets
│   ├── _redirects            # Netlify SPA routing rewrite rule
│   ├── manifest.json         # Web App Manifest
│   ├── manifest.webmanifest  # Standard PWA Web App Manifest
│   └── offline.html          # Standalone offline fallback page
├── src/
│   ├── components/           # Layout, CartDrawer, ProtectedRoute, Loading, ConfirmModal
│   ├── pages/                # Home, Shop, ProductDetail, Checkout, Orders, Profile, Admin, Login, NotFound, AccessDenied
│   ├── api.js                # Frontend API client with Bearer ID token attachment
│   ├── App.jsx               # Application root, routing, auth listener, role sync
│   ├── data.js               # Product helpers, normalization, and currency formatting
│   ├── firebase.js           # Firebase App, Auth, and Firestore initialization
│   ├── main.jsx              # Application entry point
│   └── styles.css            # Custom theme styles & typography
├── .env.example              # Documented environment variables template
├── .gitignore                # Excludes node_modules, dist, and .env
├── netlify.toml              # Netlify build configuration and SPA redirects
├── package.json              # Project dependencies and npm scripts
├── render.yaml               # Render web service deployment blueprint
└── vite.config.js            # Vite bundler & VitePWA Workbox service worker configuration
```

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **XAMPP** (with Apache and MySQL started)

### 2. Database Setup (XAMPP)
1. Open **XAMPP Control Panel** and start **MySQL** and **Apache**.
2. Navigate to `http://localhost/phpmyadmin`.
3. Create database `thread_co_db`.
4. Import `database/thread_co_db.sql` or run the scripts in `database/`.

### 3. Installation
```bash
git clone https://github.com/hpaz1058/helensystem.git
cd helensystem
npm install
```

### 4. Running the Application
```bash
# Run both Frontend (Vite) and Backend (Express) concurrently:
npm run dev

# Or run separately:
npm run server   # Starts Express backend on http://localhost:8080
npm run client   # Starts Vite PWA dev server on http://localhost:5173
```

---

## ☁️ Cloud Deployment Configuration

### Frontend (Netlify)
1. Connect repository `https://github.com/hpaz1058/helensystem.git` to **Netlify**.
2. Build Settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Environment Variables (Netlify Site settings):
   - `VITE_API_URL`: URL of your deployed Render backend (e.g. `https://thread-co-backend.onrender.com`).
4. **Authorized Domains in Firebase Console:**
   - Go to **Firebase Console** > **Authentication** > **Settings** > **Authorized domains**.
   - Add `strong-melba-f1efe5.netlify.app`.

### Backend (Render)
1. In **Render**, create a new **Web Service** from the GitHub repository.
2. Build & Runtime:
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node backend/server.js`
   - **Health Check Path:** `/api/health`
3. Environment Variables in Render:
   - `PORT`: `8080`
   - `NODE_ENV`: `production`
   - `CLIENT_ORIGIN`: `https://strong-melba-f1efe5.netlify.app`
   - `DATABASE_URL`: `mysql://<user>:<password>@<cloud-host>:<port>/<dbname>`
   - `DB_SSL`: `true`
   - `FIREBASE_PROJECT_ID`: `helen-fashion`

### Cloud MySQL Database
1. Provision a free MySQL database on **Aiven** (`aiven.io`), **Railway** (`railway.app`), or **TiDB Cloud**.
2. Run the `database/thread_co_db.sql` schema script.
3. Copy the database connection URI and paste it as `DATABASE_URL` in Render.

---

## 👩‍💻 Author
- **Helen Paz** (`hpaz1058@gmail.com`)
- Repository: [https://github.com/hpaz1058/helensystem](https://github.com/hpaz1058/helensystem)
