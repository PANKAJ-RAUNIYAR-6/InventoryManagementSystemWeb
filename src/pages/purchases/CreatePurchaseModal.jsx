import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal.jsx';
import api from '../../services/api.js';

export const CreatePurchaseModal = ({ isOpen, onClose, onCreated, suppliers = [], products = [] }) => {
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSupplierId(suppliers[0]?._id || '');
      setNotes('');
      setError('');
      // Initialize with one empty item row
      if (products.length > 0) {
        const firstProd = products[0];
        setItems([
          {
            product: firstProd._id,
            quantity: 1,
            unitPrice: firstProd.purchasePrice || 0,
            subtotal: firstProd.purchasePrice || 0,
          },
        ]);
      } else {
        setItems([]);
      }
    }
  }, [isOpen, suppliers, products]);

  const handleProductChange = (index, prodId) => {
    const selectedProd = products.find((p) => p._id === prodId);
    const updated = [...items];
    updated[index].product = prodId;
    if (selectedProd) {
      updated[index].unitPrice = selectedProd.purchasePrice || 0;
      updated[index].subtotal = Math.round(updated[index].quantity * (selectedProd.purchasePrice || 0) * 100) / 100;
    }
    setItems(updated);
  };

  const handleQuantityChange = (index, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    const updated = [...items];
    updated[index].quantity = q;
    updated[index].subtotal = Math.round(q * (updated[index].unitPrice || 0) * 100) / 100;
    setItems(updated);
  };

  const handlePriceChange = (index, price) => {
    const p = Math.max(0, Number(price) || 0);
    const updated = [...items];
    updated[index].unitPrice = p;
    updated[index].subtotal = Math.round((updated[index].quantity || 1) * p * 100) / 100;
    setItems(updated);
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    setItems([
      ...items,
      {
        product: firstProd._id,
        quantity: 1,
        unitPrice: firstProd.purchasePrice || 0,
        subtotal: firstProd.purchasePrice || 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }

    if (items.length === 0) {
      setError('Add at least one product item');
      return;
    }

    try {
      setSaving(true);
      await api.createPurchase({
        supplier: supplierId,
        items,
        notes,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create purchase order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order (Stock In)"
      size="xl"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="submit"
            form="purchase-form"
            className="btn btn-primary"
            disabled={saving || items.length === 0}
          >
            {saving ? 'Processing Order...' : 'Complete Purchase & Update Stock'}
          </button>
        </>
      }
    >
      {error && (
        <div className="badge badge-danger" style={{ width: '100%', padding: '0.65rem 1rem', marginBottom: '1.25rem', justifyContent: 'flex-start' }}>
          {error}
        </div>
      )}

      <form id="purchase-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Vendor / Supplier *</label>
            <select
              className="form-select"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
            >
              <option value="">Choose Supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.company || s.name} ({s.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Purchase Notes / Invoice Ref</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Standard quarterly restocking"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', marginBottom: '0.5rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Purchase Order Items</h4>
          <button type="button" className="btn btn-outline btn-sm" onClick={handleAddItem}>
            <Plus size={14} /> Add Line Item
          </button>
        </div>

        <div className="purchase-items-table">
          <div className="item-row header">
            <div>Product</div>
            <div>Quantity</div>
            <div>Unit Cost ($)</div>
            <div>Subtotal ($)</div>
            <div></div>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="item-row">
              <div>
                <select
                  className="form-select"
                  value={item.product}
                  onChange={(e) => handleProductChange(idx, e.target.value)}
                  required
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} [{p.sku}] (Current: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(idx, e.target.value)}
                  required
                />
              </div>

              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  value={item.unitPrice}
                  onChange={(e) => handlePriceChange(idx, e.target.value)}
                  required
                />
              </div>

              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                ${(item.subtotal || 0).toFixed(2)}
              </div>

              <div>
                <button
                  type="button"
                  className="action-icon-btn delete"
                  onClick={() => handleRemoveItem(idx)}
                  disabled={items.length <= 1}
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="purchase-total-box">
          <span className="total-label">Grand Total:</span>
          <span className="total-value">${totalAmount.toFixed(2)}</span>
        </div>
      </form>
    </Modal>
  );
};
export default CreatePurchaseModal;
