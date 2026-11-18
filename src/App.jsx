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
  doc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  setDoc,
  serverTimestamp,
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
 * Creates or synchronizes users/{UID} in Firestore.
 * Supports Role-Based Access Control (RBAC):
 * - Admin: privileged access for management & CRUD
 * - User/Customer: store browsing and ordering
 */
async function syncFirestoreUser(currentUser) {
  if (!currentUser) return 'user';

  try {
    const userRef = doc(db, 'users', currentUser.uid);
    let existingSnapshot;
    try {
      // Force fetch directly from Firebase server to bypass stale IndexedDB cache!
      existingSnapshot = await getDocFromServer(userRef);
    } catch {
      existingSnapshot = await getDoc(userRef);
    }

    const provider = currentUser.providerData?.[0]?.providerId || 'password';
    const profile = {
      UID: currentUser.uid,
      Name: currentUser.displayName || '',
      Email: currentUser.email || '',
      'Photo URL': currentUser.photoURL || '',
      Provider: provider,
    };

    // First login: create document with default role 'user' in Firestore
    if (!existingSnapshot.exists()) {
      await setDoc(userRef, {
        ...profile,
        createdAt: serverTimestamp(),
        'Created date': serverTimestamp(),
        role: 'user',
      });
      return 'user';
    }

    // Existing account: update profile details only without overwriting role
    try {
      await setDoc(userRef, profile, { merge: true });
    } catch (e) {
      // Ignore if update rule prevents merge
    }

    // Read role strictly from the Firestore user document
    const existingData = existingSnapshot.data() || {};
    const rawRole = (existingData.role || existingData.Role || existingData.ROLE || 'user').toLowerCase().trim();
    const finalRole = (rawRole === 'admin' || existingData.isAdmin === true) ? 'admin' : 'user';
    return finalRole;
  } catch (err) {
    console.warn('Firestore user sync notice:', err);
    return 'user';
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (!currentUser) {
        setUser(null);
        setRole(null);
        try { localStorage.removeItem('thread_user_role'); } catch {}
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        // Read strictly from Firestore server
        const firestoreRole = await syncFirestoreUser(currentUser);
        setRole(firestoreRole);
        try { localStorage.setItem('thread_user_role', firestoreRole); } catch {}

        const currentPath = window.location.pathname;
        if (firestoreRole === 'admin') {
          if (currentPath === '/login' || currentPath === '/profile' || currentPath === '/' || currentPath.startsWith('/shop')) {
            navigate('/admin', { replace: true });
          }
        } else {
          // Role is 'user'
          if (currentPath === '/admin' || currentPath === '/login') {
            navigate('/', { replace: true });
          }
        }

        // Live real-time listener: immediately updates when Firestore role is changed in console
        const userRef = doc(db, 'users', currentUser.uid);
        unsubscribeFirestore = onSnapshot(
          userRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() || {};
              const rawRole = (data.role || data.Role || data.ROLE || 'user').toLowerCase().trim();
              const liveRole = (rawRole === 'admin' || data.isAdmin === true) ? 'admin' : 'user';
              setRole(liveRole);
              try { localStorage.setItem('thread_user_role', liveRole); } catch {}

              const path = window.location.pathname;
              if (liveRole === 'admin' && (path === '/' || path === '/login' || path === '/profile' || path.startsWith('/shop'))) {
                navigate('/admin', { replace: true });
              } else if (liveRole === 'user' && path === '/admin') {
                navigate('/', { replace: true });
              }
            }
          },
          (err) => console.warn('Real-time role sync notice:', err)
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
        try { localStorage.setItem('thread_user_role', 'user'); } catch {}
      } finally {
        setLoading(false);
      }
    });

    return () => {
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
      try { localStorage.removeItem('thread_user_role'); } catch {}
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const googleLogin = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    setUser(cred.user);
    const userRole = await syncFirestoreUser(cred.user);
    setRole(userRole);
    try { localStorage.setItem('thread_user_role', userRole); } catch {}
    if (userRole === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
    return userRole;
  };

  const emailLogin = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    setUser(cred.user);
    const userRole = await syncFirestoreUser(cred.user);
    setRole(userRole);
    try { localStorage.setItem('thread_user_role', userRole); } catch {}
    if (userRole === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
    return userRole;
  };

  const register = async (name, email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    setUser(credential.user);
    const userRole = await syncFirestoreUser(credential.user);
    setRole(userRole);
    try { localStorage.setItem('thread_user_role', userRole); } catch {}
    if (userRole === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
    return userRole;
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

  if (loading) {
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
