import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute component for Authentication & Role-Based Access Control (RBAC).
 * - Redirects unauthenticated visitors to /login.
 * - Redirects unauthorized roles (e.g. non-admins attempting to access admin) to /access-denied.
 */
export default function ProtectedRoute({ user, role, requiredRole, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wait until Firestore role is resolved before evaluating RBAC
  if (role === null) {
    return null;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}
