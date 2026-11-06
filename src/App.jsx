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

// Pages
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import About from './pages/About';
import Confirmation from './pages/Confirmation';
import Admin from './pages/Admin';

const CART_STORAGE_KEY = 'thread-co-cart-v1';

// ============================================================
// FIRESTORE USER PROFILE
// ============================================================

/**
 * Creates users/{UID} for a first-time account.
 * Existing users keep their Firestore role, so an admin role
 * manually assigned in Firebase Console is never overwritten.
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

  // Detailed browser-side action logging. This records the exact visible
  // control the user interacted with and, when available, the product name.
  useEffect(() => {
    const getProductName = (element) => {
      const card = element.closest('.product-card, .detail-img, .product-body, .order-card, tr');
      if (!card) return null;
      const nameEl = card.querySelector('.product-name, h1, h5, strong, td:first-child, .fw-semibold');
      return nameEl?.textContent?.trim() || null;
    };

    const getControlLabel = (element) => {
      if (!element) return 'Unknown control';
      return (element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent?.replace(/\s+/g, ' ').trim() || element.value || element.name || element.tagName).slice(0, 160);
    };

    const onClick = (event) => {
      const element = event.target.closest('button, a, [role="button"]');
      if (!element) return;
      const productName = getProductName(element);
      const href = element.getAttribute('href');
      const label = getControlLabel(element);
      logUserAction(`CLICK — ${label}`, {
        element: element.tagName.toLowerCase(), label, productName, href,
        page: window.location.pathname, url: window.location.href,
        defaultPrevented: event.defaultPrevented,
      });
    };

    const onChange = (event) => {
      const element = event.target;
      if (!['SELECT', 'INPUT', 'TEXTAREA'].includes(element.tagName)) return;
      logUserAction(`CHANGE — ${element.name || element.getAttribute('aria-label') || element.placeholder || element.tagName}`, {
        element: element.tagName.toLowerCase(), name: element.name || null,
        value: element.type === 'password' ? '[hidden]' : element.value,
        page: window.location.pathname,
      });
    };

    const onSubmit = (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      logUserAction(`SUBMIT — ${form.getAttribute('aria-label') || form.id || form.className || 'form'}`, {
        page: window.location.pathname, action: form.action || null, method: form.method || 'get',
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
  // ONLINE / OFFLINE STATUS
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
  // LOAD PRODUCTS
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
        console.error('Failed to load products:', error);
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
        // Creates users/{UID} automatically on first login.
        // Existing role values such as "admin" are preserved.
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
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await updateProfile(credential.user, {
      displayName: name,
    });

    // The auth listener will also run. Creating this document here
    // makes the registration data available immediately.
    const userRef = doc(db, 'users', credential.user.uid);

    await setDoc(userRef, {
      UID: credential.user.uid,
      Name: name,
      Email: email,
      'Photo URL': '',
      Provider: 'password',
      createdAt: serverTimestamp(),
      'Created date': serverTimestamp(),
      role: 'user',
    }, { merge: true });

    setRole('user');
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
      const existingProduct = previousCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return previousCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
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
      const existingProduct = previousCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return previousCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
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
        item.id === productId
          ? { ...item, quantity }
          : item
      );
    });
  };

  const removeFromCart = (productId) => {
    setCart((previousCart) =>
      previousCart.filter((item) => item.id !== productId)
    );
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

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // ==========================================================
  // ADMIN AREA
  // ==========================================================

  if (user && role === 'admin') {
    return (
      <>
        <Layout
          user={user}
          role="admin"
          cartCount={0}
          onCart={() => {}}
          onLogout={logout}
        >
          <Routes>
            <Route path="/admin" element={<Admin />} />
            <Route
              path="*"
              element={<Navigate to="/admin" replace />}
            />
          </Routes>
        </Layout>

        {!online && (
          <div className="toast-offline">
            <i className="bi bi-wifi-off me-2" />
            Offline mode — cached browsing is available.
          </div>
        )}
      </>
    );
  }

  // ==========================================================
  // CUSTOMER AREA
  // ==========================================================

  if (user) {
    return (
      <>
        <Layout
          user={user}
          role="user"
          cartCount={cartCount}
          onCart={() => setCartOpen(true)}
          onLogout={logout}
        >
          <Routes>
            <Route path="/" element={<Home products={products} />} />
            <Route path="/shop" element={<Shop products={products} />} />
            <Route
              path="/category/:category"
              element={<CategoryRoute products={products} />}
            />
            <Route
              path="/product/:id"
              element={
                <ProductDetail
                  products={products}
                  onAdd={addToCart}
                  onBuyNow={buyNow}
                />
              }
            />
            <Route
              path="/checkout"
              element={
                <Checkout
                  user={user}
                  items={cart}
                  onPlaceOrder={placeOrder}
                />
              }
            />
            <Route
              path="/orders"
              element={<Orders user={user} />}
            />
            <Route path="/about" element={<About />} />
            <Route
              path="/order-confirmation"
              element={<Confirmation />}
            />
            <Route
              path="/admin"
              element={<Navigate to="/" replace />}
            />
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </Layout>

        {cartOpen && (
          <CartDrawer
            items={cart}
            onClose={() => setCartOpen(false)}
            onChange={changeQuantity}
            onRemove={removeFromCart}
          />
        )}

        {!online && (
          <div className="toast-offline">
            <i className="bi bi-wifi-off me-2" />
            Offline mode — cached browsing is available.
          </div>
        )}
      </>
    );
  }

  // ==========================================================
  // GUEST AREA
  // ==========================================================

  return (
    <>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/shop" element={<Shop products={products} />} />
        <Route
          path="/product/:id"
          element={
            <ProductDetail
              products={products}
              onAdd={addToCart}
              onBuyNow={buyNow}
            />
          }
        />
        <Route
          path="/category/:category"
          element={<CategoryRoute products={products} />}
        />
        <Route
          path="/login"
          element={
            <Login
              onGoogle={googleLogin}
              onEmailLogin={emailLogin}
              onRegister={register}
            />
          }
        />
        <Route
          path="/admin"
          element={<Navigate to="/login" replace />}
        />
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>

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

  return (
    <Shop
      products={products}
      initialCategory={category}
    />
  );
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
