import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { normalizeProducts, peso } from '../data';
import ConfirmModal from '../components/ConfirmModal';

const EMPTY_PRODUCT = {
  name: '',
  price: '',
  category: 'Tops',
  image: '/images/products/basic-tee.webp',
  description: '',
};

const CATEGORIES = ['Tops', 'Dresses', 'Bottoms', 'Accessories'];
const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function Admin({ user, role, onLogout }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_PRODUCT });
  const [editingId, setEditingId] = useState(null);
  const [tab, setTab] = useState('products');
  const [deleteId, setDeleteId] = useState(null);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2200);
  };

  const loadData = async () => {
    setLoading(true);

    try {
      const [productData, orderData] = await Promise.all([
        api.products(),
        api.adminOrders(),
      ]);

      const productList = productData.products || productData || [];
      const orderList = orderData.orders || orderData || [];

      setProducts(normalizeProducts(productList));
      setOrders(orderList);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      showNotice('Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_PRODUCT });
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price),
      };

      if (editingId) {
        await api.updateProduct(editingId, payload);
        showNotice('Product updated successfully.');
      } else {
        await api.createProduct(payload);
        showNotice('Product added successfully.');
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error('Product save failed:', error);
      showNotice(error.message || 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      price: product.price || '',
      category: product.category || 'Tops',
      image: product.image || EMPTY_PRODUCT.image,
      description: product.description || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await api.deleteProduct(deleteId);
      setDeleteId(null);
      showNotice('Product deleted successfully.');
      await loadData();
    } catch (error) {
      console.error('Product delete failed:', error);
      showNotice(error.message || 'Unable to delete product.');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.updateOrderStatus(orderId, status);
      showNotice('Order status updated.');
      await loadData();
    } catch (error) {
      console.error('Order status update failed:', error);
      showNotice(error.message || 'Unable to update order.');
    }
  };

  const stats = useMemo(() => {
    const pending = orders.filter(
      (order) => order.status === 'Processing' || order.status === 'Shipped'
    ).length;

    const delivered = orders.filter(
      (order) => order.status === 'Delivered'
    ).length;

    const revenue = orders
      .filter((order) => order.status !== 'Cancelled')
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    return {
      products: products.length,
      orders: orders.length,
      pending,
      delivered,
      revenue,
    };
  }, [products, orders]);

  return (
    <div className="page">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="small text-uppercase text-secondary mb-1">
            Thread & Co. / Administration
          </div>
          <h1 className="serif mb-1">Admin Dashboard</h1>
          <div className="text-secondary small">
            Manage products, customer orders, and administrator settings.
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline-dark rounded-pill"
          onClick={loadData}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-2" />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {user && (
        <div className="card border shadow-sm rounded-4 mb-4 overflow-hidden bg-white">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Admin'}
                    className="rounded-circle border"
                    style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fs-4 fw-bold"
                    style={{ width: '56px', height: '56px' }}
                  >
                    {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="mb-0 fw-bold">{user.displayName || 'Administrator'}</h5>
                    <span className="badge bg-success text-uppercase fs-7 px-3 py-1">
                      <i className="bi bi-shield-check me-1" />
                      Role: Admin
                    </span>
                  </div>
                  <div className="text-muted small mt-1 d-flex flex-wrap align-items-center gap-3">
                    <span><i className="bi bi-envelope me-1" />{user.email}</span>
                    <span><i className="bi bi-person-badge me-1" />UID: <code className="text-dark">{user.uid}</code></span>
                    <span><i className="bi bi-google text-danger me-1" />Google Account</span>
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="btn btn-outline-danger btn-sm rounded-pill px-3 ms-auto"
                >
                  <i className="bi bi-box-arrow-right me-1" />
                  Log out
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="row g-3 mb-4">
        <StatCard label="Products" value={stats.products} icon="bi-bag" />
        <StatCard label="Orders" value={stats.orders} icon="bi-receipt" />
        <StatCard label="Pending" value={stats.pending} icon="bi-clock" />
        <StatCard label="Delivered" value={stats.delivered} icon="bi-check2-circle" />
        <StatCard label="Revenue" value={peso(stats.revenue)} icon="bi-cash-stack" />
      </div>

      <div className="btn-group mb-4" role="tablist">
        <button
          type="button"
          className={tab === 'products' ? 'btn btn-dark' : 'btn btn-outline-dark'}
          onClick={() => setTab('products')}
        >
          <i className="bi bi-grid me-2" />
          Products Catalog
        </button>
        <button
          type="button"
          className={tab === 'orders' ? 'btn btn-dark' : 'btn btn-outline-dark'}
          onClick={() => setTab('orders')}
        >
          <i className="bi bi-box-seam me-2" />
          Customer Orders
        </button>
        <button
          type="button"
          className={tab === 'profile' ? 'btn btn-dark' : 'btn btn-outline-dark'}
          onClick={() => setTab('profile')}
        >
          <i className="bi bi-person-vcard me-2" />
          Admin Profile Details
        </button>
      </div>

      {tab === 'products' && (
        <div className="row g-4">
          <div className="col-lg-5">
            <form className="info-card p-4" onSubmit={saveProduct}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="serif mb-1">
                    {editingId ? 'Edit Product' : 'Add Product'}
                  </h5>
                  <div className="small text-secondary">
                    Product information shown in the shop.
                  </div>
                </div>
                {editingId && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark rounded-pill"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Product Name</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  placeholder="e.g. Linen Blazer"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={form.price}
                  onChange={(event) => updateForm('price', event.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(event) => updateForm('category', event.target.value)}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Image Path</label>
                <input
                  className="form-control"
                  value={form.image}
                  onChange={(event) => updateForm('image', event.target.value)}
                  placeholder="/images/products/basic-tee.webp"
                />
                <div className="form-text">
                  Use an image stored inside public/images.
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={form.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                  placeholder="Describe the product..."
                />
              </div>

              <button
                type="submit"
                className="btn btn-darksoft w-100"
                disabled={saving}
              >
                <i
                  className={
                    saving
                      ? 'bi bi-hourglass-split me-2'
                      : editingId
                      ? 'bi bi-check2 me-2'
                      : 'bi bi-plus-lg me-2'
                  }
                />
                {saving
                  ? 'Saving...'
                  : editingId
                  ? 'Update Product'
                  : 'Add Product'}
              </button>
            </form>
          </div>

          <div className="col-lg-7">
            <div className="admin-table table-wrap">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={product.image}
                            alt={product.name}
                            width="48"
                            height="54"
                            className="rounded"
                            style={{ objectFit: 'cover' }}
                          />
                          <span>{product.name}</span>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>{peso(product.price)}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-dark me-1"
                          onClick={() => editProduct(product)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeleteId(product.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="admin-table table-wrap">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>GCash Ref.</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>#{String(order.id).slice(-6)}</strong>
                    <div className="small text-secondary">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : '—'}
                    </div>
                  </td>
                  <td>
                    <div>{order.customer?.name || '—'}</div>
                    <div className="small text-secondary">
                      {order.customer?.email || '—'}
                    </div>
                  </td>
                  <td>{order.paymentMethod || '—'}</td>
                  <td>{order.gcashReference || '—'}</td>
                  <td>{peso(order.total)}</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={order.status || 'Processing'}
                      onChange={(event) =>
                        updateOrderStatus(order.id, event.target.value)
                      }
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td colSpan="6">
                    <div className="empty">No customer orders yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'profile' && user && (
        <div className="card border shadow-sm rounded-4 overflow-hidden mb-4 bg-white">
          <div className="card-header bg-light py-3 px-4 d-flex align-items-center justify-content-between">
            <h5 className="mb-0 fw-semibold">Administrator Profile & System Role</h5>
            <span className="badge bg-success px-3 py-2 text-uppercase fs-7">
              <i className="bi bi-shield-check me-1" />
              Role: Admin
            </span>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="text-muted small text-uppercase fw-semibold mb-1">Display Name</label>
                <div className="p-2 bg-light rounded border text-dark fw-semibold">{user.displayName || 'Administrator'}</div>
              </div>
              <div className="col-12 col-md-6">
                <label className="text-muted small text-uppercase fw-semibold mb-1">Email Address</label>
                <div className="p-2 bg-light rounded border text-dark text-truncate">{user.email}</div>
              </div>
              <div className="col-12 col-md-6">
                <label className="text-muted small text-uppercase fw-semibold mb-1">Account UID</label>
                <div className="p-2 bg-light rounded border text-dark font-monospace small text-truncate">{user.uid}</div>
              </div>
              <div className="col-12 col-md-6">
                <label className="text-muted small text-uppercase fw-semibold mb-1">Sign-In Provider</label>
                <div className="p-2 bg-light rounded border text-dark">
                  <i className="bi bi-google text-danger me-2" />
                  Google Account (OAuth 2.0)
                </div>
              </div>
              <div className="col-12">
                <label className="text-muted small text-uppercase fw-semibold mb-1">Admin Privileges & Access</label>
                <div className="p-3 bg-light rounded border text-dark small">
                  <ul className="mb-0 ps-3">
                    <li>Full MySQL CRUD operations (<code>INSERT</code>, <code>SELECT</code>, <code>UPDATE</code>, <code>DELETE</code>) via <code>/api/product</code>.</li>
                    <li>Customer order tracking and status updates (Processing, Shipped, Delivered, Cancelled).</li>
                    <li>Automatic login routing: Admin credentials immediately load the Admin Dashboard without intermediate prompts.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete product?"
        message="This will permanently remove the product from the catalog."
        confirmText="Delete product"
        danger
        icon="bi-trash3"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />

      {notice && (
        <div className="action-toast">
          <i className="bi bi-check-circle-fill me-2" />
          {notice}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="col-6 col-xl">
      <div className="info-card p-3 h-100">
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <div className="small text-secondary">{label}</div>
            <div className="fs-4 fw-semibold mt-1">{value}</div>
          </div>
          <div
            className="confirm-icon"
            style={{ width: 42, height: 42, margin: 0, fontSize: 18 }}
          >
            <i className={`bi ${icon}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
