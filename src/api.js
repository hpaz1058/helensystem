import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:8080');

const isObject = (value) => value !== null && typeof value === 'object';

function productSummary(product) {
  if (!isObject(product)) return product;
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    category: product.category,
    quantity: product.quantity,
  };
}

function summarizeResponse(data) {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      products: data.map(productSummary),
    };
  }
  if (Array.isArray(data?.products)) {
    return {
      count: data.products.length,
      products: data.products.map(productSummary),
    };
  }
  if (Array.isArray(data?.items)) {
    return {
      count: data.items.length,
      items: data.items.map(productSummary),
    };
  }
  return data;
}

function logApi(message, details = {}) {
  const timestamp = new Date().toLocaleTimeString();
  console.groupCollapsed(`%c[API ${timestamp}] ${message}`, 'color:#7a4e2d;font-weight:700');
  console.log(details);
  console.groupEnd();
}

async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const url = `${API_URL}${path}`;
  let requestBody;

  if (options.body) {
    try {
      requestBody = JSON.parse(options.body);
    } catch {
      requestBody = options.body;
    }
  }

  const started = performance.now();
  logApi(`${method} ${path} — REQUEST`, {
    url,
    method,
    body: requestBody,
  });

  try {
    const authHeaders = {};
    if (auth && auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        if (idToken) {
          authHeaders['Authorization'] = `Bearer ${idToken}`;
        }
      } catch (authErr) {
        console.warn('Could not retrieve Firebase ID token:', authErr);
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options.headers || {})
      },
    });
    const data = await response.json().catch(() => ({}));
    const duration = Math.round(performance.now() - started);

    logApi(`${method} ${path} — ${response.ok ? 'SUCCESS' : 'ERROR'} (${response.status})`, {
      url,
      status: response.status,
      durationMs: duration,
      response: summarizeResponse(data),
    });

    if (!response.ok) throw new Error(data.message || `Request failed: ${response.status}`);
    return data;
  } catch (error) {
    logApi(`${method} ${path} — NETWORK/CLIENT ERROR`, {
      url,
      durationMs: Math.round(performance.now() - started),
      error: error.message,
    });
    throw error;
  }
}

export const api = {
  products: () => request('/api/product'),
  product: (id) => request(`/api/product/${id}`),
  createProduct: (payload) => request('/api/product', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id, payload) => request(`/api/product/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/api/product/${id}`, { method: 'DELETE' }),
  createOrder: (payload) => request('/api/order', { method: 'POST', body: JSON.stringify(payload) }),
  orders: (email) => request(`/api/order?email=${encodeURIComponent(email)}`),
  adminOrders: () => request('/api/admin/orders'),
  updateOrderStatus: (id, status) => request(`/api/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  activity: (payload) => request('/api/activity', { method: 'POST', body: JSON.stringify(payload) }).catch(() => null),
  health: () => request('/api/health'),
};

export function logUserAction(action, details = {}) {
  const timestamp = new Date().toLocaleTimeString();
  console.groupCollapsed(`%c[UI ${timestamp}] ${action}`, 'color:#315b8a;font-weight:700');
  console.log(details);
  console.groupEnd();
}
