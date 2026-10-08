import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import Modal from '../../components/common/Modal.jsx';
import api from '../../services/api.js';

export const ProductFormModal = ({
  isOpen,
  onClose,
  product = null,
  categories = [],
  suppliers = [],
  onSaved,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    supplier: '',
    description: '',
    purchasePrice: '',
    sellingPrice: '',
    currentStock: '0',
    minStockLevel: '5',
    unit: 'pcs',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category?._id || product.category || '',
        supplier: product.supplier?._id || product.supplier || '',
        description: product.description || '',
        purchasePrice: product.purchasePrice?.toString() || '',
        sellingPrice: product.sellingPrice?.toString() || '',
        currentStock: product.currentStock?.toString() || '0',
        minStockLevel: product.minStockLevel?.toString() || '5',
        unit: product.unit || 'pcs',
        status: product.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category: categories[0]?._id || '',
        supplier: suppliers[0]?._id || '',
        description: '',
        purchasePrice: '',
        sellingPrice: '',
        currentStock: '0',
        minStockLevel: '5',
        unit: 'pcs',
        status: 'active',
      });
    }
    setError('');
  }, [product, categories, suppliers, isOpen]);

  const generateSku = () => {
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD') : 'PRD';
    const random = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, sku: `${prefix}-${random}` }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.sku || !formData.category) {
      setError('Product name, SKU, and category are required.');
      return;
    }

    if (Number(formData.purchasePrice) < 0 || Number(formData.sellingPrice) < 0) {
      setError('Prices cannot be negative.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        minStockLevel: Number(formData.minStockLevel),
        currentStock: Number(formData.currentStock),
        supplier: formData.supplier || null,
      };

      if (product) {
        await api.updateProduct(product._id, payload);
      } else {
        await api.createProduct(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Product'}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" form="product-form" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </button>
        </>
      }
    >
      {error && (
        <div className="badge badge-danger" style={{ width: '100%', padding: '0.65rem 1rem', marginBottom: '1.25rem', justifyContent: 'flex-start' }}>
          {error}
        </div>
      )}

      <form id="product-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="e.g. Ergonomic Office Desk"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">SKU / Code *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                name="sku"
                className="form-control"
                placeholder="DSK-109"
                value={formData.sku}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={generateSku}
                title="Auto generate SKU"
              >
                <Sparkles size={14} /> Auto
              </button>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              name="category"
              className="form-select"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Primary Supplier</label>
            <select
              name="supplier"
              className="form-select"
              value={formData.supplier}
              onChange={handleChange}
            >
              <option value="">None / Multiple</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.company || s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Purchase Cost ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="purchasePrice"
              className="form-control"
              placeholder="0.00"
              value={formData.purchasePrice}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Selling Price ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="sellingPrice"
              className="form-control"
              placeholder="0.00"
              value={formData.sellingPrice}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unit of Measure</label>
            <input
              type="text"
              name="unit"
              className="form-control"
              placeholder="pcs, box, kg, etc."
              value={formData.unit}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          {!product && (
            <div className="form-group">
              <label className="form-label">Initial Stock Quantity</label>
              <input
                type="number"
                min="0"
                name="currentStock"
                className="form-control"
                placeholder="0"
                value={formData.currentStock}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Low Stock Alert Threshold</label>
            <input
              type="number"
              min="0"
              name="minStockLevel"
              className="form-control"
              placeholder="5"
              value={formData.minStockLevel}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Product Status</label>
            <select
              name="status"
              className="form-select"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description / Specifications</label>
          <textarea
            name="description"
            rows="2"
            className="form-control"
            placeholder="Product details, material, warranty or dimensions..."
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>
      </form>
    </Modal>
  );
};
export default ProductFormModal;
