import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ShoppingBag,
  ShoppingCart,
  Boxes,
  History,
  FileBarChart2,
  Users,
  X,
  Warehouse,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import './Sidebar.css';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isManager } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <NavLink to="/dashboard" className="sidebar-brand" onClick={onClose}>
          <div className="brand-icon">
            <Warehouse size={22} />
          </div>
          <div className="brand-text">
            <h1>OptiStock</h1>
            <span>Inventory System</span>
          </div>
        </NavLink>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close navigation">
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Main</div>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <div className="nav-section-title">Catalog & Inventory</div>
        <NavLink
          to="/products"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Package size={18} />
          <span>Products</span>
        </NavLink>

        {isManager && (
          <NavLink
            to="/categories"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Tags size={18} />
            <span>Categories</span>
          </NavLink>
        )}

        <NavLink
          to="/inventory"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Boxes size={18} />
          <span>Current Stock</span>
        </NavLink>

        <NavLink
          to="/inventory/history"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <History size={18} />
          <span>Stock History</span>
        </NavLink>

        <div className="nav-section-title">Operations</div>
        {isManager && (
          <NavLink
            to="/suppliers"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Truck size={18} />
            <span>Suppliers</span>
          </NavLink>
        )}

        {isManager && (
          <NavLink
            to="/purchases"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <ShoppingBag size={18} />
            <span>Purchases</span>
          </NavLink>
        )}

        <NavLink
          to="/sales"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <ShoppingCart size={18} />
          <span>Sales (POS)</span>
        </NavLink>

        {isManager && (
          <>
            <div className="nav-section-title">Analytics & Reports</div>
            <NavLink
              to="/reports"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <FileBarChart2 size={18} />
              <span>Reports & Export</span>
            </NavLink>
          </>
        )}

        {isAdmin && (
          <>
            <div className="nav-section-title">System Admin</div>
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Users size={18} />
              <span>User Management</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <span className="user-role-tag">{user?.role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
