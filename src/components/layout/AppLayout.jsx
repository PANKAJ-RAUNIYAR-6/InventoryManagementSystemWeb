import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import ToastContainer from '../common/Toast.jsx';
import './AppLayout.css';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard Overview';
    if (pathname.startsWith('/products')) return 'Product Inventory';
    if (pathname.startsWith('/categories')) return 'Category Management';
    if (pathname.startsWith('/suppliers')) return 'Supplier Directory';
    if (pathname.startsWith('/purchases')) return 'Purchase Orders';
    if (pathname.startsWith('/sales')) return 'Sales & Invoicing (POS)';
    if (pathname.startsWith('/inventory/history')) return 'Stock Movement History';
    if (pathname.startsWith('/inventory')) return 'Current Stock & Inventory';
    if (pathname.startsWith('/reports')) return 'Business Reports & Analytics';
    if (pathname.startsWith('/users')) return 'User Access Management';
    return 'Inventory Management System';
  };

  return (
    <div className="app-layout">
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content-wrapper">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={getPageTitle(location.pathname)}
        />
        <main className="page-container">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};
export default AppLayout;
