import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const shopItems = [
  ['/', 'Home', 'bi-house'],
  ['/shop', 'All Shop', 'bi-bag'],
  ['/category/Tops', 'Tops', 'bi-person'],
  ['/category/Dresses', 'Dresses', 'bi-stars'],
  ['/category/Bottoms', 'Bottoms', 'bi-layout-text-window'],
  ['/category/Accessories', 'Accessories', 'bi-bag-heart'],
];

const moreItems = [
  ['/about', 'About', 'bi-info-circle'],
  ['/orders', 'Orders', 'bi-box-seam'],
  ['/profile', 'Profile', 'bi-person-circle'],
];

export default function Layout({ children, user, role, cartCount, onCart, onLogout }) {
  const location = useLocation();
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  const isAdminView = location.pathname.startsWith('/admin');

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container-fluid h-100 d-flex align-items-center justify-content-between px-3 px-lg-4">
          <div className="d-flex align-items-center gap-3">
            <Link to="/" className="text-decoration-none text-dark d-flex align-items-center gap-2">
              <span className="brand-mark">♧</span>
              <span className="brand">Thread & Co.</span>
            </Link>
            {role === 'admin' && (
              <div className="d-none d-sm-flex align-items-center gap-2 ms-3">
                <Link to="/admin" className={`btn btn-sm rounded-pill ${isAdminView ? 'btn-dark' : 'btn-outline-dark'}`}>
                  <i className="bi bi-speedometer2 me-1" />Admin
                </Link>
                <Link to="/shop" className={`btn btn-sm rounded-pill ${!isAdminView ? 'btn-dark' : 'btn-outline-dark'}`}>
                  <i className="bi bi-bag me-1" />Storefront
                </Link>
              </div>
            )}
          </div>

          <div className="d-flex align-items-center gap-3">
            {user ? (
              <>
                <span className="d-none d-md-inline small text-secondary">
                  {user.displayName || user.email}
                </span>
                {role === 'admin' && <span className="admin-badge">ADMIN</span>}
                <button className="btn btn-sm border-0" aria-label="Search">
                  <i className="bi bi-search" />
                </button>
                <button className="btn btn-sm border-0 position-relative" onClick={onCart} aria-label="Cart">
                  <i className="bi bi-bag" />
                  {cartCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark">
                      {cartCount}
                    </span>
                  )}
                </button>
                <div className="dropdown">
                  <button className="btn btn-sm border-0" data-bs-toggle="dropdown" aria-label="User menu">
                    <i className="bi bi-person" />
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-sm border">
                    <li><span className="dropdown-item-text small fw-semibold">{user.displayName || 'Account'}</span></li>
                    <li><span className="dropdown-item-text small text-muted">{user.email}</span></li>
                    <li>
                      <span className="dropdown-item-text small">
                        <span className={`badge ${role === 'admin' ? 'bg-success' : 'bg-secondary'} text-uppercase`}>
                          Role: {role || 'user'}
                        </span>
                      </span>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <i className="bi bi-person-circle me-2" />My Profile
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/orders">
                        <i className="bi bi-box-seam me-2" />My Orders
                      </Link>
                    </li>
                    {role === 'admin' && (
                      <li>
                        <Link className="dropdown-item text-primary" to="/admin">
                          <i className="bi bi-speedometer2 me-2" />Admin Dashboard
                        </Link>
                      </li>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={onLogout}>
                        <i className="bi bi-box-arrow-right me-2" />Log out
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-dark btn-sm rounded-pill px-3">
                  <i className="bi bi-box-arrow-in-right me-1" />Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {!isAdminView && (
        <aside className="sidebar">
          <div className="nav-section">Shop</div>
          {shopItems.map(([path, label, icon]) => (
            <Link key={path} to={path} className={`nav-pill text-decoration-none ${isActive(path) ? 'active' : ''}`}>
              <i className={`bi ${icon}`} />
              <span>{label}</span>
            </Link>
          ))}
          <div className="nav-section border-top mt-3">Account & More</div>
          {moreItems.map(([path, label, icon]) => (
            <Link key={path} to={path} className={`nav-pill text-decoration-none ${isActive(path) ? 'active' : ''}`}>
              <i className={`bi ${icon}`} />
              <span>{label}</span>
            </Link>
          ))}
          {role === 'admin' && (
            <div className="mt-3 pt-3 border-top">
              <Link to="/admin" className="nav-pill text-decoration-none text-success fw-semibold">
                <i className="bi bi-speedometer2" />
                <span>Admin Panel</span>
              </Link>
            </div>
          )}
        </aside>
      )}

      <main className={isAdminView ? '' : 'content-wrap'}>{children}</main>

      {!isAdminView && (
        <nav className="mobile-nav">
          {shopItems.slice(0, 5).map(([path, label, icon]) => (
            <Link key={path} to={path} className="text-decoration-none">
              <button>
                <i className={`bi ${icon}`} />
                {label}
              </button>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
