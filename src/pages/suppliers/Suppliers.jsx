import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Truck,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Eye,
  ShoppingBag,
} from 'lucide-react';
import api from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import Modal from '../../components/common/Modal.jsx';
import './Suppliers.css';

export const Suppliers = () => {
  const { addToast } = useNotification();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // View Supplier Details / Purchase History Modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSupplierData, setSelectedSupplierData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.getSuppliers({ search });
      if (res.success) {
        setSuppliers(res.suppliers || []);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load suppliers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name || '',
      company: sup.company || '',
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || '',
      status: sup.status || 'active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleViewDetails = async (sup) => {
    try {
      setViewLoading(true);
      setViewModalOpen(true);
      const res = await api.getSupplier(sup._id);
      if (res.success) {
        setSelectedSupplierData(res);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load supplier history', 'error');
    } finally {
      setViewLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setFormError('Contact name and phone number are required');
      return;
    }

    try {
      setSaving(true);
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier._id, formData);
        addToast('Supplier updated successfully', 'success');
      } else {
        await api.createSupplier(formData);
        addToast('Supplier registered successfully', 'success');
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      setFormError(err.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sup) => {
    if (!window.confirm(`Are you sure you want to delete supplier '${sup.name}'?`)) {
      return;
    }

    try {
      await api.deleteSupplier(sup._id);
      addToast('Supplier deleted successfully', 'success');
      fetchSuppliers();
    } catch (err) {
      addToast(err.message || 'Cannot delete supplier', 'error');
    }
  };

  return (
    <div className="suppliers-page">
      <div className="page-header-row">
        <div>
          <h2>Supplier Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Maintain vendor directories, contact details, and procurement histories
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> New Supplier
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by supplier name, company, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading suppliers...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="empty-state card">
          <Truck size={36} />
          <h4>No Suppliers Found</h4>
          <p>Add procurement suppliers using the button above.</p>
        </div>
      ) : (
        <div className="suppliers-grid">
          {suppliers.map((sup) => (
            <div key={sup._id} className="supplier-card">
              <div>
                <div className="supplier-card-header">
                  <div className="supplier-title">
                    <h4>{sup.company || sup.name}</h4>
                    {sup.company && <span>Rep: {sup.name}</span>}
                  </div>
                  <span
                    className={`badge ${
                      sup.status === 'active' ? 'badge-success' : 'badge-secondary'
                    }`}
                  >
                    {sup.status}
                  </span>
                </div>

                <div className="supplier-details">
                  <div className="detail-line">
                    <Phone size={14} color="#64748b" />
                    <span>{sup.phone}</span>
                  </div>
                  {sup.email && (
                    <div className="detail-line">
                      <Mail size={14} color="#64748b" />
                      <span>{sup.email}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div className="detail-line">
                      <MapPin size={14} color="#64748b" />
                      <span>{sup.address}</span>
                    </div>
                  )}
                </div>

                <div className="supplier-stats-row">
                  <div className="supplier-stat-item">
                    <span>Purchase Orders</span>
                    <strong>{sup.purchaseCount ?? 0}</strong>
                  </div>
                  <div className="supplier-stat-item">
                    <span>Total Procurement</span>
                    <strong>${Number(sup.totalPurchasedAmount || 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '0.85rem',
                }}
              >
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleViewDetails(sup)}
                >
                  <Eye size={14} /> History
                </button>
                <div className="actions-cell">
                  <button
                    className="action-icon-btn"
                    onClick={() => handleOpenEdit(sup)}
                    title="Edit supplier"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className="action-icon-btn delete"
                    onClick={() => handleDelete(sup)}
                    title="Delete supplier"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Register Supplier'}
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
              form="supplier-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Create Supplier'}
            </button>
          </>
        }
      >
        {formError && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '0.65rem 1rem', marginBottom: '1rem', justifyContent: 'flex-start' }}>
            {formError}
          </div>
        )}

        <form id="supplier-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Person *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. John Miller"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company / Business Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Apex Hardware Supplies"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                className="form-control"
                placeholder="+1 (800) 555-0199"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="orders@supplier.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address / Location</label>
            <input
              type="text"
              className="form-control"
              placeholder="123 Distribution Boulevard, Chicago, IL"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Supplier View & Purchase History Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`Supplier History: ${selectedSupplierData?.supplier?.company || selectedSupplierData?.supplier?.name || 'Details'}`}
        size="lg"
        footer={
          <button className="btn btn-secondary" onClick={() => setViewModalOpen(false)}>
            Close
          </button>
        }
      >
        {viewLoading || !selectedSupplierData ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div>
            <h4 style={{ marginBottom: '0.85rem' }}>Associated Purchase Orders</h4>
            {selectedSupplierData.purchases?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No purchases placed with this vendor yet.</p>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>PO #</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSupplierData.purchases?.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.purchaseNumber}</td>
                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td>{p.items?.length || 0}</td>
                        <td style={{ fontWeight: 600 }}>${p.totalAmount?.toFixed(2)}</td>
                        <td>
                          <span className="badge badge-success">{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Suppliers;
