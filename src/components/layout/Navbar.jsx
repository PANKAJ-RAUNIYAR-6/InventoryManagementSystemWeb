import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, LogOut, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import './Navbar.css';

export const Navbar = ({ onToggleSidebar, title = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of the system?')) {
      logout();
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="menu-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        <h2 className="navbar-title">{title}</h2>
      </div>

      <div className="navbar-right">
        {/* Notifications Dropdown */}
        <div className="notif-wrapper" ref={notifRef}>
          <button
            className="notif-btn"
            onClick={() => setShowNotifs(!showNotifs)}
            aria-label="View notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <h4>Notifications ({unreadCount} new)</h4>
                {unreadCount > 0 && (
                  <button className="mark-all-btn" onClick={markAllAsRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications to display</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                      onClick={() => markAsRead(n._id)}
                    >
                      <div className="notif-item-title">
                        {n.type === 'LOW_STOCK' ? (
                          <AlertTriangle size={14} color="#f59e0b" />
                        ) : n.type === 'PURCHASE' ? (
                          <Package size={14} color="#2563eb" />
                        ) : (
                          <CheckCircle size={14} color="#10b981" />
                        )}
                        <span>{n.title}</span>
                      </div>
                      <div className="notif-item-msg">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile action */}
        <div className="user-profile-menu">
          <button className="logout-btn" onClick={handleLogout} title="Log out">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
