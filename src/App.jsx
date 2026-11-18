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
  const email = (currentUser.email || '').toLowerCase().trim();
  const isPrivileged = email === 'hpaz1058@gmail.com' || email.includes('admin');

  try {
    const userRef = doc(db, 'users', currentUser.uid);
    const existingSnapshot = await getDoc(userRef);

    const provider = currentUser.providerData?.[0]?.providerId || 'password';
    const profile = {
      UID: currentUser.uid,
      Name: currentUser.displayName || '',
      Email: currentUser.email || '',
      'Photo URL': currentUser.photoURL || '',
      Provider: provider,
    };

    if (!existingSnapshot.exists()) {
      const defaultRole = isPrivileged ? 'admin' : 'user';
      await setDoc(userRef, {
        ...profile,
        createdAt: serverTimestamp(),
        'Created date': serverTimestamp(),
        role: defaultRole,
      });
      return defaultRole;
    }

    try {
      await setDoc(userRef, profile, { merge: true });
    } catch (e) {
      // Ignore if update rule prevents merge
    }

    const existingData = existingSnapshot.data() || {};
    const roleValue = (existingData.role || '').toLowerCase().trim();
    if (isPrivileged || roleValue === 'admin') {
      return 'admin';
    }
    return roleValue || 'user';
  } catch (err) {
    console.warn('Firestore user sync notice:', err);
    if (isPrivileged) return 'admin';
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
  // FIREBASE AUTH + FIRESTORE ROLE
  // ----------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const firestoreRole = await syncFirestoreUser(currentUser);
        setRole(firestoreRole);

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
        const email = (currentUser?.email || '').toLowerCase();
        if (email === 'hpaz1058@gmail.com' || email.includes('admin')) {
          setRole('admin');
        } else {
          setRole('user');
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
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
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const googleLogin = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const emailLogin = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (name, email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });

    const userRef = doc(db, 'users', credential.user.uid);
    const isPrivileged = email.toLowerCase().includes('admin') || email.toLowerCase() === 'hpaz1058@gmail.com';
    const assignedRole = isPrivileged ? 'admin' : 'user';

    await setDoc(
      userRef,
      {
        UID: credential.user.uid,
        Name: name,
        Email: email,
        'Photo URL': '',
        Provider: 'password',
        createdAt: serverTimestamp(),
        'Created date': serverTimestamp(),
        role: assignedRole,
      },
      { merge: true }
    );

    setRole(assignedRole);
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
          {/* Public Views */}
          <Route path="/" element={user ? <Home products={products} /> : <Welcome />} />
          <Route path="/shop" element={<Shop products={products} />} />
          <Route path="/category/:category" element={<CategoryRoute products={products} />} />
          <Route
            path="/product/:id"
            element={<ProductDetail products={products} onAdd={addToCart} onBuyNow={buyNow} />}
          />
          <Route path="/about" element={<About />} />

          {/* Auth View */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to={role === 'admin' ? '/admin' : '/profile'} replace />
              ) : (
                <Login onGoogle={googleLogin} onEmailLogin={emailLogin} onRegister={register} />
              )
            }
          />

          {/* Protected Customer Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user} role={role}>
                <Profile user={user} role={role} onLogout={logout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute user={user} role={role}>
                <Orders user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute user={user} role={role}>
                <Checkout user={user} items={cart} onPlaceOrder={placeOrder} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation"
            element={
              <ProtectedRoute user={user} role={role}>
                <Confirmation />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Route (RBAC) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute user={user} role={role} requiredRole="admin">
                <Admin />
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
