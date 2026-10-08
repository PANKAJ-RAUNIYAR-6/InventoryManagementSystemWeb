import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import Modal from '../../components/common/Modal.jsx';
import api from '../../services/api.js';

export const CreateSaleModal = ({ isOpen, onClose, onCreated, products = [] }) => {
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Available in-stock products
  const inStockProducts = products.filter((p) => p.currentStock > 0);

  useEffect(() => {
    if (isOpen) {
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setPaymentMethod('Cash');
      setNotes('');
      setError('');
      if (inStockProducts.length > 0) {
        const first = inStockProducts[0];
        setItems([
          {
            product: first._id,
            quantity: 1,
            unitPrice: first.sellingPrice || 0,
            subtotal: first.sellingPrice || 0,
            availableStock: first.currentStock,
          },
        ]);
      } else {
        setItems([]);
      }
    }
  }, [isOpen]);

  const handleProductChange = (index, prodId) => {
    const selected = products.find((p) => p._id === prodId);
    if (!selected) return;

    const updated = [...items];
    updated[index].product = prodId;
    updated[index].unitPrice = selected.sellingPrice || 0;
    updated[index].availableStock = selected.currentStock;
    // ensure qty does not exceed available
    const maxQty = Math.min(updated[index].quantity, selected.currentStock);
    updated[index].quantity = Math.max(1, maxQty);
    updated[index].subtotal = Math.round(updated[index].quantity * selected.sellingPrice * 100) / 100;
    setItems(updated);
  };

  const handleQuantityChange = (index, qty) => {
    const q = Number(qty);
    const item = items[index];

    if (q > item.availableStock) {
      setError(`Cannot sell more than available stock (${item.availableStock} in inventory)`);
      return;
    } else {
      setError('');
    }

    const updated = [...items];
    updated[index].quantity = Math.max(1, q);
    updated[index].subtotal = Math.round(Math.max(1, q) * (updated[index].unitPrice || 0) * 100) / 100;
    setItems(updated);
  };

  const handlePriceChange = (index, price) => {
    const p = Math.max(0, Number(price) || 0);
    const updated = [...items];
    updated[index].unitPrice = p;
    updated[index].subtotal = Math.round(updated[index].quantity * p * 100) / 100;
    setItems(updated);
  };

  const handleAddItem = () => {
    if (inStockProducts.length === 0) return;
    const first = inStockProducts[0];
    setItems([
      ...items,
      {
        product: first._id,
        quantity: 1,
        unitPrice: first.sellingPrice || 0,
        subtotal: first.sellingPrice || 0,
        availableStock: first.currentStock,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, it) => sum + (it.subtotal || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Add at least one product item');
      return;
    }

    for (const item of items) {
      if (item.quantity > item.availableStock) {
        setError(`Insufficient stock for selected item. Max available: ${item.availableStock}`);
        return;
      }
    }

    try {
      setSaving(true);
      await api.createSale({
        customerName,
        customerPhone,
        paymentMethod,
        notes,
        items,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Sale registration failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Point of Sale (Create Sale Invoice)"
      size="xl"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="submit"
            form="sale-form"
            className="btn btn-success"
            disabled={saving || items.length === 0}
          >
            {saving ? 'Processing Sale...' : `Complete Sale ($${totalAmount.toFixed(2)})`}
          </button>
        </>
      }
    >
      {error && (
        <div className="badge badge-danger" style={{ width: '100%', padding: '0.65rem 1rem', marginBottom: '1.25rem', justifyContent: 'flex-start' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {inStockProducts.length === 0 ? (
        <div className="empty-state">
          <p style={{ color: '#ef4444', fontWeight: 600 }}>
            No products in stock! Please add stock via purchase orders before creating sales.
          </p>
        </div>
      ) : (
        <form id="sale-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Walk-in Customer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Customer Phone / Contact</label>
              <input
                type="tel"
                className="form-control"
                placeholder="+1 555 0192"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="UPI/Transfer">Bank Transfer / UPI</option>
                <option value="Credit">Customer Credit</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Sale Line Items</h4>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleAddItem}>
              <Plus size={14} /> Add Product
            </button>
          </div>

          <div className="sales-pos-table">
            <div className="sale-item-row header">
              <div>Product Item</div>
              <div>Qty to Sell</div>
              <div>Unit Price ($)</div>
              <div>Subtotal ($)</div>
              <div></div>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="sale-item-row">
                <div>
                  <select
                    className="form-select"
                    value={item.product}
                    onChange={(e) => handleProductChange(idx, e.target.value)}
                    required
                  >
                    {inStockProducts.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} [{p.sku}] - Stock: {p.currentStock} {p.unit}
                      </option>
                    ))}
                  </select>
                  <div className="stock-pill">
                    Available in warehouse: <strong>{item.availableStock}</strong> units
                  </div>
                </div>

                <div>
                  <input
                    type="number"
                    min="1"
                    max={item.availableStock}
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

          <div className="sale-summary-card">
            <div className="summary-row">
              <span>Items Count:</span>
              <strong>{items.length} product(s)</strong>
            </div>
            <div className="summary-row">
              <span>Payment Type:</span>
              <strong>{paymentMethod}</strong>
            </div>
            <div className="summary-row total">
              <span>Grand Total Due:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
export default CreateSaleModal;
