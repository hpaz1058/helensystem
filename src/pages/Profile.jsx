import React from 'react';
import { Link } from 'react-router-dom';

export default function Profile({ user, role, onLogout }) {
  if (!user) return null;

  const provider = user.providerData?.[0]?.providerId || 'password';
  const providerLabel = provider === 'google.com' ? 'Google Account' : 'Email & Password';

  return (
    <div className="container py-4" style={{ maxWidth: '720px' }}>
      <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <span className="text-secondary small text-uppercase letter-spacing-1">Thread & Co. / Account</span>
          <h1 className="serif fs-2 mb-0 mt-1">User Profile</h1>
        </div>
        <button onClick={onLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3">
          <i className="bi bi-box-arrow-right me-1" /> Log out
        </button>
      </div>

      <div className="card border shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="card-header bg-light py-3 px-4 d-flex align-items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="rounded-circle border" style={{ width: '56px', height: '56px', objectFit: 'cover' }} />
          ) : (
            <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center fs-4 fw-bold" style={{ width: '56px', height: '56px' }}>
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h5 className="mb-0 fw-semibold">{user.displayName || 'Customer'}</h5>
            <span className="text-muted small">{user.email}</span>
          </div>
          <div className="ms-auto">
            <span className={`badge ${role === 'admin' ? 'bg-success' : 'bg-secondary'} px-3 py-2 text-uppercase fs-7`}>
              <i className={`bi ${role === 'admin' ? 'bi-shield-check' : 'bi-person'} me-1`} />
              Role: {role || 'user'}
            </span>
          </div>
        </div>

        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="text-muted small text-uppercase fw-semibold mb-1">Display Name</label>
              <div className="p-2 bg-light rounded border text-dark">{user.displayName || 'Not specified'}</div>
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
                <i className={`bi ${provider === 'google.com' ? 'bi-google text-danger' : 'bi-envelope'} me-2`} />
                {providerLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        {role === 'admin' ? (
          <div className="col-12">
            <div className="card h-100 border border-success-subtle bg-success-subtle bg-opacity-10 rounded-4 p-4 shadow-sm text-center">
              <div className="fs-2 text-success mb-2"><i className="bi bi-speedometer2" /></div>
              <h5 className="fw-semibold text-success mb-1">Admin Dashboard</h5>
              <p className="text-muted small mb-3">You are signed in with an Administrator account. Access the management dashboard for MySQL products catalog & customer orders.</p>
              <Link to="/admin" className="btn btn-success rounded-pill px-4 text-white">Go to Admin Dashboard</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="col-12 col-md-6">
              <div className="card h-100 border rounded-4 p-3 shadow-sm text-center">
                <div className="fs-3 text-dark mb-2"><i className="bi bi-box-seam" /></div>
                <h6 className="fw-semibold mb-1">My Orders</h6>
                <p className="text-muted small mb-3">Review past purchases and shipping tracking.</p>
                <Link to="/orders" className="btn btn-outline-dark btn-sm rounded-pill mt-auto">View Orders</Link>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="card h-100 border rounded-4 p-3 shadow-sm text-center">
                <div className="fs-3 text-dark mb-2"><i className="bi bi-bag" /></div>
                <h6 className="fw-semibold mb-1">Continue Shopping</h6>
                <p className="text-muted small mb-3">Explore modern wardrobe essentials and new arrivals.</p>
                <Link to="/shop" className="btn btn-dark btn-sm rounded-pill mt-auto">Browse Shop</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
