import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from 'react-router-dom';

// Firebase
import { auth, googleProvider, db } from './firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';

// API / Data
import { api, logUserAction } from './api';
import { fallbackProducts, normalizeProducts } from './data';

// Components
import Layout from './components/Layout';
import CartDrawer from './components/CartDrawer';
import Loading from './components/Loading';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import About from './pages/About';
import Confirmation from './pages/Confirmation';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import AccessDenied from './pages/AccessDenied';

const CART_STORAGE_KEY = 'thread-co-cart-v1';

// ============================================================
// FIRESTORE USER PROFILE & RBAC
// ============================================================

/**
 * Extracts normalized role ('admin' | 'user') from a Firestore user document.
 * Supports field names: role, Role, ROLE, roles, Roles, ROLES, userRole, accountRole,
 * as well as boolean flags isAdmin / admin and string arrays (e.g. ['Admin']).
 */
function extractRoleFromDoc(data) {
  if (!data || typeof data !== 'object') return 'user';

  if (data.isAdmin === true || data.admin === true) return 'admin';

  const candidates = [
    data.role,
    data.Role,
    data.ROLE,
    data.roles,
    data.Roles,
    data.ROLES,
    data.userRole,
    data.accountRole,
  ];

  for (const val of candidates) {
    if (val === undefined || val === null || val === '') continue;
    if (Array.isArray(val)) {
      const normalized = val.map((v) => String(v).toLowerCase().trim());
      if (normalized.includes('admin') || normalized.includes('administrator')) {
        return 'admin';
      }
    } else {
      const normalized = String(val).toLowerCase().trim();
      if (normalized === 'admin' || normalized === 'administrator') {
        return 'admin';
      }
    }
  }

  return 'user';
}

/**
 * Fetches user profile from Firestore users/{UID}.
 * Uses live server data without persisting stale IndexedDB cache.
 * Retries once with a fresh ID token if permission-denied occurs during initial auth handshake.
 * If user document does not exist, checks for a pre-created record by Email before initializing with 'user'.
 */
async function syncFirestoreUser(currentUser) {
  if (!currentUser) return { role: 'user', error: null };

  const userRef = doc(db, 'users', currentUser.uid);

  const readUserDoc = async () => {
    try {
      return await getDocFromServer(userRef);
    } catch (serverErr) {
      if (serverErr?.code === 'permission-denied') throw serverErr;
      return await getDoc(userRef);
    }
  };

  try {
    // 1. Ensure Firebase Auth token is attached and active
    try {
      await currentUser.getIdToken();
    } catch {}

    let existingSnapshot;
    try {
      existingSnapshot = await readUserDoc();
    } catch (firstErr) {
      // Retry once after force-refreshing token (handles fresh Google Sign-In handshake)
      if (firstErr?.code === 'permission-denied') {
        await new Promise((resolve) => setTimeout(resolve, 450));
        try {
          await currentUser.getIdToken(true);
        } catch {}
        existingSnapshot = await readUserDoc();
      } else {
        throw firstErr;
      }
    }

    // 2. First login: check if admin pre-created a doc by email; otherwise create with default 'user'
    if (!existingSnapshot.exists()) {
      let initialRole = 'user';
      if (currentUser.email) {
        try {
          const usersCol = collection(db, 'users');
          const [byEmailCap, byEmailLow] = await Promise.all([
            getDocs(query(usersCol, where('Email', '==', currentUser.email))),
            getDocs(query(usersCol, where('email', '==', currentUser.email))),
          ]);
          const matchedDoc = byEmailCap.docs[0] || byEmailLow.docs[0];
          if (matchedDoc) {
            initialRole = extractRoleFromDoc(matchedDoc.data());
          }
        } catch {
          // Ignore if Firestore rules restrict collection queries
        }
      }

      const provider = currentUser.providerData?.[0]?.providerId || 'google.com';
      try {
        await setDoc(userRef, {
          UID: currentUser.uid,
          Name: currentUser.displayName || '',
          Email: currentUser.email || '',
          'Photo URL': currentUser.photoURL || '',
          Provider: provider,
          createdAt: serverTimestamp(),
          'Created date': serverTimestamp(),
          role: initialRole,
        });
      } catch (createErr) {
        console.warn('[RBAC Sync] Could not auto-create user doc:', createErr);
      }
      return { role: initialRole, error: null };
    }

    // 3. Document exists: read role strictly from Firestore document
    const existingData = existingSnapshot.data() || {};
    const finalRole = extractRoleFromDoc(existingData);
    console.log(
      `[RBAC Sync] User: ${currentUser.email} | UID: ${currentUser.uid} | Firestore role: "${existingData.role ?? existingData.roles ?? existingData.Role}" => Active Role: ${finalRole}`
    );
    return { role: finalRole, error: null };
  } catch (err) {
    console.error('[RBAC Sync Error - Check Firebase Rules]:', err);
    return {
      role: 'user',
      error: err?.code === 'permission-denied' ? 'permission-denied' : (err?.message || 'sync-failed'),
    };
  }
}

// ============================================================
// MAIN APPLICATION
// ============================================================

function AppInner() {
  // Detailed browser-side action logging.
  useEffect(() => {
    const getProductName = (element) => {
      const card = element.closest('.product-card, .detail-img, .product-body, .order-card, tr');
      if (!card) return null;
      const nameEl = card.querySelector('.product-name, h1, h5, strong, td:first-child, .fw-semibold');
      return nameEl?.textContent?.trim() || null;
    };

    const getControlLabel = (element) => {
      if (!element) return 'Unknown control';
      return (
        element.getAttribute('aria-label') ||
        element.getAttribute('title') ||
        element.textContent?.replace(/\s+/g, ' ').trim() ||
        element.value ||
        element.name ||
        element.tagName
      ).slice(0, 160);
    };

    const onClick = (event) => {
      const element = event.target.closest('button, a, [role="button"]');
      if (!element) return;
      const productName = getProductName(element);
      const href = element.getAttribute('href');
      const label = getControlLabel(element);
      logUserAction(`CLICK — ${label}`, {
        element: element.tagName.toLowerCase(),
        label,
        productName,
        href,
        page: window.location.pathname,
        url: window.location.href,
        defaultPrevented: event.defaultPrevented,
      });
    };

    const onChange = (event) => {
      const element = event.target;
      if (!['SELECT', 'INPUT', 'TEXTAREA'].includes(element.tagName)) return;
      logUserAction(
        `CHANGE — ${element.name || element.getAttribute('aria-label') || element.placeholder || element.tagName}`,
        {
          element: element.tagName.toLowerCase(),
          name: element.name || null,
          value: element.type === 'password' ? '[hidden]' : element.value,
          page: window.location.pathname,
        }
      );
    };

    const onSubmit = (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      logUserAction(`SUBMIT — ${form.getAttribute('aria-label') || form.id || form.className || 'form'}`, {
        page: window.location.pathname,
        action: form.action || null,
        method: form.method || 'get',
      });
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('change', onChange, true);
    document.addEventListener('submit', onSubmit, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('change', onChange, true);
      document.removeEventListener('submit', onSubmit, true);
    };
  }, []);

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(null);
  const [products, setProducts] = useState(fallbackProducts);

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return JSON.parse(savedCart || '[]');
    } catch (error) {
      console.error('Failed to load cart:', error);
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  // ----------------------------------------------------------
  // CART PERSISTENCE
  // ----------------------------------------------------------
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // ----------------------------------------------------------
  // ONLINE / OFFLINE STATUS MONITORING
  // ----------------------------------------------------------
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ----------------------------------------------------------
  // LOAD PRODUCTS FROM API
  // ----------------------------------------------------------
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await api.products();
        const productList = data.products || data;

        setProducts(
          productList?.length
            ? normalizeProducts(productList)
            : fallbackProducts
        );
      } catch (error) {
        console.error('Failed to load products from API:', error);
        setProducts(fallbackProducts);
      }
    };

    loadProducts();
  }, []);

  // ----------------------------------------------------------
  // FIREBASE AUTH + FIRESTORE REAL-TIME ROLE SYNC
  // ----------------------------------------------------------
  useEffect(() => {
    let unsubscribeFirestore = null;
    let isCancelled = false;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (!currentUser) {
        setUser(null);
        setRole(null);
        setFirestoreError(null);
        try { localStorage.removeItem('thread_user_role'); } catch {}
        setLoading(false);
        return;
      }

      // Hold UI in loading state while Firestore role is verified (prevents user-dashboard flicker)
      setLoading(true);
      setRole(null);
      setFirestoreError(null);
      setUser(currentUser);

      try {
        // Read strictly from Firestore server
        const { role: firestoreRole, error: syncError } = await syncFirestoreUser(currentUser);
        if (isCancelled) return;

        setRole(firestoreRole);
        setFirestoreError(syncError);
        try { localStorage.setItem('thread_user_role', firestoreRole); } catch {}

        const currentPath = window.location.pathname;
        if (firestoreRole === 'admin') {
          if (currentPath !== '/admin') {
            navigate('/admin', { replace: true });
          }
        } else {
          // Role is 'user'
          if (currentPath === '/admin' || currentPath === '/login' || currentPath === '/access-denied') {
            navigate('/', { replace: true });
          }
        }

        // Live real-time listener: immediately updates when Firestore role is changed in console
        const userRef = doc(db, 'users', currentUser.uid);
        unsubscribeFirestore = onSnapshot(
          userRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const liveRole = extractRoleFromDoc(snapshot.data());
              setRole(liveRole);
              setFirestoreError(null);
              try { localStorage.setItem('thread_user_role', liveRole); } catch {}

              const path = window.location.pathname;
              if (liveRole === 'admin' && path !== '/admin') {
                navigate('/admin', { replace: true });
              } else if (liveRole === 'user' && (path === '/admin' || path === '/access-denied')) {
                navigate('/', { replace: true });
              }
            }
          },
          (err) => {
            console.warn('Real-time role sync notice:', err);
            if (err?.code === 'permission-denied') {
              setFirestoreError('permission-denied');
            }
          }
        );

        try {
          await api.activity({
            type: 'login',
            uid: currentUser.uid,
            email: currentUser.email,
          });
        } catch (activityError) {
          console.warn('Login activity logging failed:', activityError);
        }
      } catch (error) {
        console.error('Failed to sync Firestore user:', error);
        setRole('user');
        setFirestoreError(error?.code || 'sync-failed');
        try { localStorage.setItem('thread_user_role', 'user'); } catch {}
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // ----------------------------------------------------------
  // AUTH ACTIONS
  // ----------------------------------------------------------
  const logout = async () => {
    try {
      if (user) {
        await api.activity({
          type: 'logout',
          uid: user.uid,
          email: user.email,
        });
      }

      await signOut(auth);
      setCartOpen(false);
      setUser(null);
      setRole(null);
      setFirestoreError(null);
      try { localStorage.removeItem('thread_user_role'); } catch {}
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const googleLogin = async () => {
    // onAuthStateChanged handles Firestore role lookup and instant redirect atomically
    await signInWithPopup(auth, googleProvider);
  };

  const emailLogin = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (name, email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
  };

  // ----------------------------------------------------------
  // CART ACTIONS
  // ----------------------------------------------------------
  const addToCart = (product) => {
    if (!user) {
      navigate('/login');
      return false;
    }

    setCart((previousCart) => {
      const existingProduct = previousCart.find((item) => item.id === product.id);

      if (existingProduct) {
        return previousCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...previousCart, { ...product, quantity: 1 }];
    });

    api.activity({
      type: 'cart_add',
      uid: user.uid,
      productId: product.id,
      productName: product.name,
    });

    return true;
  };

  const buyNow = (product) => {
    if (!user) {
      navigate('/login');
      return false;
    }

    setCart((previousCart) => {
      const existingProduct = previousCart.find((item) => item.id === product.id);

      if (existingProduct) {
        return previousCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...previousCart, { ...product, quantity: 1 }];
    });

    api.activity({
      type: 'cart_add',
      uid: user.uid,
      productId: product.id,
      productName: product.name,
    });

    navigate('/checkout');
    return true;
  };

  const changeQuantity = (productId, quantity) => {
    setCart((previousCart) => {
      if (quantity <= 0) {
        return previousCart.filter((item) => item.id !== productId);
      }

      return previousCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const removeFromCart = (productId) => {
    setCart((previousCart) => previousCart.filter((item) => item.id !== productId));
  };

  // ----------------------------------------------------------
  // CHECKOUT
  // ----------------------------------------------------------
  const placeOrder = async (form) => {
    if (!user) {
      navigate('/login');
      return null;
    }

    const order = await api.createOrder({
      customer: {
        uid: user.uid,
        name: form.name,
        email: user.email,
        phone: form.phone,
        address: form.address,
      },
      items: form.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      total: form.total,
      paymentMethod: form.paymentMethod,
      gcashReference: form.gcashReference || '',
      status: 'Processing',
    });

    setCart([]);

    await api.activity({
      type: 'order_create',
      uid: user.uid,
      orderId: order.id,
      total: form.total,
      paymentMethod: form.paymentMethod,
    });

    return order;
  };

  if (loading || (user && role === null)) {
    return <Loading />;
  }

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const isAdmin = role === 'admin';

  return (
    <>
      <Layout
        user={user}
        role={role}
        cartCount={cartCount}
        onCart={() => setCartOpen(true)}
        onLogout={logout}
      >
        {firestoreError === 'permission-denied' && (
          <div className="alert alert-warning d-flex align-items-center justify-content-between m-3 rounded-3 shadow-sm" role="alert">
            <div className="small">
              <i className="bi bi-exclamation-triangle-fill me-2" />
              <strong>Firestore Rules Notice:</strong> Unable to read your role from Firestore (<code>permission-denied</code>). Publish <code>allow read, write: if request.auth != null;</code> in Firebase Console → Firestore → Rules.
            </div>
            <button type="button" className="btn-close btn-sm ms-3" aria-label="Close" onClick={() => setFirestoreError(null)} />
          </div>
        )}
        <Routes>
          {/* Landing / Storefront Views: strictly separated by role with zero flicker */}
          <Route
            path="/"
            element={
              isAdmin ? (
                <Navigate to="/admin" replace />
              ) : user ? (
                <Home products={products} />
              ) : (
                <Welcome />
              )
            }
          />
          <Route
            path="/shop"
            element={isAdmin ? <Navigate to="/admin" replace /> : <Shop products={products} />}
          />
          <Route
            path="/category/:category"
            element={isAdmin ? <Navigate to="/admin" replace /> : <CategoryRoute products={products} />}
          />
          <Route
            path="/product/:id"
            element={
              isAdmin ? (
                <Navigate to="/admin" replace />
              ) : (
                <ProductDetail products={products} onAdd={addToCart} onBuyNow={buyNow} />
              )
            }
          />
          <Route
            path="/about"
            element={isAdmin ? <Navigate to="/admin" replace /> : <About />}
          />

          {/* Auth View */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to={isAdmin ? '/admin' : '/'} replace />
              ) : (
                <Login onGoogle={googleLogin} onEmailLogin={emailLogin} onRegister={register} />
              )
            }
          />

          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user} role={role}>
                {isAdmin ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Profile user={user} role={role} onLogout={logout} />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute user={user} role={role}>
                {isAdmin ? <Navigate to="/admin" replace /> : <Orders user={user} />}
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute user={user} role={role}>
                {isAdmin ? <Navigate to="/admin" replace /> : <Checkout user={user} items={cart} onPlaceOrder={placeOrder} />}
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation"
            element={
              <ProtectedRoute user={user} role={role}>
                {isAdmin ? <Navigate to="/admin" replace /> : <Confirmation />}
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Route (RBAC) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute user={user} role={role} requiredRole="admin">
                <Admin user={user} role={role} onLogout={logout} />
              </ProtectedRoute>
            }
          />

          {/* Custom Error Pages */}
          <Route path="/access-denied" element={<AccessDenied role={role} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>

      {/* Cart Drawer */}
      {cartOpen && (
        <CartDrawer
          items={cart}
          onClose={() => setCartOpen(false)}
          onChange={changeQuantity}
          onRemove={removeFromCart}
        />
      )}

      {/* Offline Banner Indicator */}
      {!online && (
        <div className="toast-offline">
          <i className="bi bi-wifi-off me-2" />
          Offline mode — cached browsing is available.
        </div>
      )}
    </>
  );
}

// ============================================================
// CATEGORY ROUTE
// ============================================================

function CategoryRoute({ products }) {
  const { category } = useParams();
  return <Shop products={products} initialCategory={category} />;
}

// ============================================================
// APP ENTRY
// ============================================================

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
