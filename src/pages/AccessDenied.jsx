import React from 'react';
import { Link } from 'react-router-dom';

export default function AccessDenied({ role }) {
  return (
    <div className="container py-5 my-5 text-center" style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="text-danger mb-3" style={{ fontSize: '3.5rem' }}>
        <i className="bi bi-shield-x" />
      </div>
      <h1 className="serif display-2 fw-bold text-dark mb-1">403</h1>
      <h2 className="serif fs-2 text-danger mb-3">Access Denied</h2>
      <p className="text-muted mx-auto mb-3" style={{ maxWidth: '520px' }}>
        You do not have permission to access the <strong>Admin Dashboard & Management Module</strong>. 
        Your current role is <span className="badge bg-secondary text-uppercase ms-1">{role || 'Customer / User'}</span>.
      </p>
      <div className="alert alert-warning py-2 px-3 small mx-auto mb-4" style={{ maxWidth: '480px' }}>
        <i className="bi bi-info-circle me-1" />
        To access administrative privileges, sign in with an authorized Administrator account.
      </div>
      <div className="d-flex gap-3 justify-content-center flex-wrap">
        <Link to="/shop" className="btn btn-dark px-4 py-2 rounded-pill">
          <i className="bi bi-bag me-2" />Return to Store
        </Link>
        <Link to="/login" className="btn btn-outline-dark px-4 py-2 rounded-pill">
          <i className="bi bi-box-arrow-in-right me-2" />Switch Account / Sign In
        </Link>
      </div>
    </div>
  );
}
