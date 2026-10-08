import React, { useState, useEffect } from 'react';
import { Plus, Search, Tags, Edit2, Trash2, Package } from 'lucide-react';
import api from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import Modal from '../../components/common/Modal.jsx';
import './Categories.css';

export const Categories = () => {
  const { addToast } = useNotification();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getCategories({ search });
      if (res.success) {
        setCategories(res.categories || []);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', status: 'active' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      status: cat.status || 'active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        await api.updateCategory(editingCategory._id, formData);
        addToast('Category updated successfully', 'success');
      } else {
        await api.createCategory(formData);
        addToast('Category created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category '${cat.name}'?`)) {
      return;
    }

    try {
      await api.deleteCategory(cat._id);
      addToast('Category removed successfully', 'success');
      fetchCategories();
    } catch (err) {
      addToast(err.message || 'Could not delete category', 'error');
    }
  };

  return (
    <div className="categories-page">
      <div className="page-header-row">
        <div>
          <h2>Category Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Classify and organize inventory lines with automatic product count tracking
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> New Category
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search categories by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-state card">
          <Tags size={36} />
          <h4>No Categories Registered</h4>
          <p>Create your first product category using the button above.</p>
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map((cat) => (
            <div key={cat._id} className="category-card">
              <div className="category-card-top">
                <h4>{cat.name}</h4>
                <div className="actions-cell">
                  <button
                    className="action-icon-btn"
                    onClick={() => handleOpenEdit(cat)}
                    title="Edit category"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className="action-icon-btn delete"
                    onClick={() => handleDelete(cat)}
                    title="Delete category"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <p>{cat.description || 'No description provided.'}</p>

              <div className="category-card-bottom">
                <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Package size={12} /> {cat.productCount ?? 0} Products
                </span>
                <span className={`badge ${cat.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                  {cat.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
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
              form="category-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Save Category'}
            </button>
          </>
        }
      >
        {formError && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '0.65rem 1rem', marginBottom: '1rem', justifyContent: 'flex-start' }}>
            {formError}
          </div>
        )}

        <form id="category-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Electrical Components"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows="3"
              className="form-control"
              placeholder="Brief summary of items in this category..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
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
    </div>
  );
};
export default Categories;
