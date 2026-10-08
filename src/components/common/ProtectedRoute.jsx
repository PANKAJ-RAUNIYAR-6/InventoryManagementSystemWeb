import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '500px', margin: '4rem auto', background: '#fff', borderRadius: '12px', border: '1px solid #fee2e2' }}>
        <h2 style={{ color: '#dc2626', marginBottom: '0.75rem' }}>Access Restricted</h2>
        <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
          Your account role (<strong>{user.role}</strong>) does not have permission to access this page.
        </p>
        <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return children;
};
export default ProtectedRoute;
