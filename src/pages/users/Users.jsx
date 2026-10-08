import React, { useState, useEffect } from 'react';
import { Plus, Users as UsersIcon, Edit2, Trash2, Shield, UserCheck, UserX } from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import Modal from '../../components/common/Modal.jsx';
import './Users.css';

export const Users = () => {
  const { user: currentUser } = useAuth();
  const { addToast } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Staff',
    phone: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      if (res.success) {
        setUsers(res.users || []);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Staff',
      phone: '',
      status: 'active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'Staff',
      phone: u.phone || '',
      status: u.status || 'active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.email) {
      setFormError('Name and email are required');
      return;
    }

    if (!editingUser && !formData.password) {
      setFormError('Password is required for new accounts');
      return;
    }

    try {
      setSaving(true);
      if (editingUser) {
        await api.updateUser(editingUser._id, formData);
        addToast('User account updated successfully', 'success');
      } else {
        await api.createUser(formData);
        addToast('New user registered successfully', 'success');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (u._id === currentUser._id) {
      addToast('You cannot delete your own active administrator account', 'warning');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove user account '${u.name}'?`)) {
      return;
    }

    try {
      await api.deleteUser(u._id);
      addToast('User deleted successfully', 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const getRoleClass = (role) => {
    if (role === 'Admin') return 'role-badge admin';
    if (role === 'Inventory Manager') return 'role-badge manager';
    return 'role-badge staff';
  };

  return (
    <div className="users-page">
      <div className="page-header-row">
        <div>
          <h2>User Access Control</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            System administrator console: Assign roles, permissions, and account statuses
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="card">
        <div className="data-table-container">
          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-muted)' }}>Loading system users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <UsersIcon size={36} />
              <h4>No Users Found</h4>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Assigned Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      {u._id === currentUser._id && (
                        <span style={{ fontSize: '0.72rem', color: '#2563eb' }}>(You)</span>
                      )}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={getRoleClass(u.role)}>
                        <Shield size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {u.role}
                      </span>
                    </td>
                    <td>{u.phone || 'N/A'}</td>
                    <td>
                      <span
                        className={`badge ${
                          u.status === 'active' ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="action-icon-btn"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit user"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="action-icon-btn delete"
                          onClick={() => handleDelete(u)}
                          disabled={u._id === currentUser._id}
                          title="Delete user"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User Credentials & Role' : 'Create User Account'}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="user-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </button>
          </>
        }
      >
        {formError && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '0.65rem 1rem', marginBottom: '1rem', justifyContent: 'flex-start' }}>
            {formError}
          </div>
        )}

        <form id="user-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Michael Scott"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-control"
              placeholder="michael@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={!!editingUser}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Role Access *</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="Staff">Staff (Sales POS & View Only)</option>
                <option value="Inventory Manager">Inventory Manager (Stock, POs, Products)</option>
                <option value="Admin">Admin (Full System & User Control)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Contact</label>
            <input
              type="tel"
              className="form-control"
              placeholder="+1 555 0192"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {editingUser ? 'Reset Password (leave empty to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              className="form-control"
              placeholder={editingUser ? '••••••••' : 'Minimum 6 characters'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Users;
