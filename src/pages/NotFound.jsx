import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container py-5 my-5 text-center" style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="brand-mark mb-2" style={{ fontSize: '3.5rem' }}>♧</div>
      <h1 className="serif display-1 fw-bold text-dark mb-0">404</h1>
      <h2 className="serif fs-2 text-secondary mb-3">Page Not Found</h2>
      <p className="text-muted mx-auto mb-4" style={{ maxWidth: '480px' }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <div className="d-flex gap-3 justify-content-center flex-wrap">
        <Link to="/" className="btn btn-dark px-4 py-2 rounded-pill">
          <i className="bi bi-house-door me-2" />Return to Home
        </Link>
        <Link to="/shop" className="btn btn-outline-dark px-4 py-2 rounded-pill">
          <i className="bi bi-bag me-2" />Browse Shop
        </Link>
      </div>
    </div>
  );
}
