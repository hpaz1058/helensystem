import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const items = [
  ['/', 'Home', 'bi-house'],
  ['/shop', 'All Shop', 'bi-bag'],
  ['/category/Tops', 'Tops', 'bi-person'],
  ['/category/Dresses', 'Dresses', 'bi-stars'],
  ['/category/Bottoms', 'Bottoms', 'bi-layout-text-window'],
  ['/category/Accessories', 'Accessories', 'bi-bag-heart'],
  ['/about', 'About', 'bi-info-circle'],
  ['/orders', 'Orders', 'bi-box-seam']
];

export default function Layout({ children, user, role, cartCount, onCart, onLogout }) {
  const location = useLocation();
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  return <div className="app-shell">
    <header className="topbar">
      <div className="container-fluid h-100 d-flex align-items-center justify-content-between px-3 px-lg-4">
        <Link to={role === 'admin' ? '/admin' : '/'} className="text-decoration-none text-dark d-flex align-items-center gap-2">
          <span className="brand-mark">♧</span><span className="brand">Thread & Co.</span>
        </Link>
        <div className="d-flex align-items-center gap-3">
          <span className="d-none d-md-inline small text-secondary">{user?.displayName || user?.email}</span>
          {role === 'admin' && <span className="admin-badge">ADMIN</span>}
          <button className="btn btn-sm border-0" aria-label="Search"><i className="bi bi-search"/></button>
          {role !== 'admin' && <button className="btn btn-sm border-0 position-relative" onClick={onCart} aria-label="Cart"><i className="bi bi-bag"/>{cartCount>0&&<span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark">{cartCount}</span>}</button>}
          <div className="dropdown">
            <button className="btn btn-sm border-0" data-bs-toggle="dropdown"><i className="bi bi-person"/></button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><span className="dropdown-item-text small fw-semibold">{user?.displayName || 'User'}</span></li>
              <li><span className="dropdown-item-text small text-muted">{user?.email}</span></li>
              <li><span className="dropdown-item-text small"><span className={`badge ${role === 'admin' ? 'bg-success' : 'bg-secondary'}`}>Role: {role || 'user'}</span></span></li>
              <li><hr className="dropdown-divider"/></li>
              {role === 'admin' && <li><Link className="dropdown-item" to="/admin"><i className="bi bi-speedometer2 me-2"/>Admin Dashboard</Link></li>}
              <li><button className="dropdown-item text-danger" onClick={onLogout}><i className="bi bi-box-arrow-right me-2"/>Log out</button></li>
            </ul>
          </div>
        </div>
      </div>
    </header>
    {role !== 'admin' && <aside className="sidebar">
      <div className="nav-section">Shop</div>
      {items.slice(0,6).map(([path,label,icon])=><Link key={path} to={path} className={`nav-pill text-decoration-none ${isActive(path)?'active':''}`}><i className={`bi ${icon}`}/><span>{label}</span></Link>)}
      <div className="nav-section border-top mt-3">More</div>
      {items.slice(6).map(([path,label,icon])=><Link key={path} to={path} className={`nav-pill text-decoration-none ${isActive(path)?'active':''}`}><i className={`bi ${icon}`}/><span>{label}</span></Link>)}
    </aside>}
    <main className={role === 'admin' ? '' : 'content-wrap'}>{children}</main>
    {role !== 'admin' && <nav className="mobile-nav">{items.slice(0,5).map(([path,label,icon])=><Link key={path} to={path} className="text-decoration-none"><button><i className={`bi ${icon}`}/>{label}</button></Link>)}</nav>}
  </div>
}
