import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  History,
  Sliders,
  DollarSign,
  Search,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import Modal from '../../components/common/Modal.jsx';
import './Inventory.css';

export const Inventory = () => {
  const { isManager } = useAuth();
  const { addToast } = useNotification();

  const [summary, setSummary] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Stock Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock Count Audit');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getInventorySummary();
      if (res.success) {
        setSummary(res.summary);
        setInventory(res.inventory || []);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load inventory summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdjust = (item) => {
    setSelectedProduct(item);
    setNewQuantity(item.currentStock.toString());
    setAdjustReason('Stock Count Audit');
    setAdjustNotes('');
    setAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduct || newQuantity === '') return;

    try {
      setAdjusting(true);
      await api.adjustStock({
        productId: selectedProduct._id,
        newQuantity: Number(newQuantity),
        reason: adjustReason,
        notes: adjustNotes,
      });
      addToast('Inventory count adjusted and audit logged!', 'success');
      setAdjustModalOpen(false);
      fetchInventory();
    } catch (err) {
      addToast(err.message || 'Failed to adjust stock', 'error');
    } finally {
      setAdjusting(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    );
  });

  return (
    <div className="inventory-page">
      <div className="page-header-row">
        <div>
          <h2>Current Stock & Valuation</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Real-time warehouse balance, valuation, and physical audit controls
          </p>
        </div>

        <Link to="/inventory/history" className="btn btn-outline">
          <History size={16} /> View Stock Movement History
        </Link>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="inventory-summary-cards">
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Total Stock Quantity</span>
              <span className="stat-value">{summary.totalItems}</span>
              <span className="stat-subtext">Across {summary.totalProducts} distinct SKUs</span>
            </div>
            <div className="stat-icon-wrap stat-icon-blue">
              <Boxes size={22} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Inventory Cost Value</span>
              <span className="stat-value">${summary.totalStockValue?.toLocaleString()}</span>
              <span className="stat-subtext">Total capital tied up</span>
            </div>
            <div className="stat-icon-wrap stat-icon-amber">
              <DollarSign size={22} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Retail Potential</span>
              <span className="stat-value">${summary.totalRetailValue?.toLocaleString()}</span>
              <span className="stat-subtext">Potential Profit: ${summary.potentialProfit?.toLocaleString()}</span>
            </div>
            <div className="stat-icon-wrap stat-icon-green">
              <DollarSign size={22} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Stock Status Alerts</span>
              <span className="stat-value" style={{ color: summary.lowStockCount > 0 ? '#d97706' : '#10b981' }}>
                {summary.lowStockCount + summary.outOfStockCount}
              </span>
              <span className="stat-subtext">
                {summary.lowStockCount} Low, {summary.outOfStockCount} Out of stock
              </span>
            </div>
            <div className="stat-icon-wrap stat-icon-rose">
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search inventory by product name, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Real-time Inventory Table */}
      <div className="card">
        <div className="data-table-container">
          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-muted)' }}>Calculating warehouse balances...</p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="empty-state">
              <Boxes size={36} />
              <h4>No Inventory Found</h4>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product & SKU</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Min Level</th>
                  <th>Unit Cost</th>
                  <th>Total Valuation</th>
                  <th>Status</th>
                  {isManager && <th>Adjust</th>}
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}><code>{item.sku}</code></div>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{item.category}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {item.currentStock} {item.unit}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>
                      {item.minStockLevel} {item.unit}
                    </td>
                    <td>${item.purchasePrice?.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>${item.stockValue?.toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.status === 'Out of Stock'
                            ? 'badge-danger'
                            : item.status === 'Low Stock'
                            ? 'badge-warning'
                            : 'badge-success'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    {isManager && (
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenAdjust(item)}
                          title="Manually adjust stock for audit or shrinkage"
                        >
                          <Sliders size={14} /> Adjust
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Audit Stock Adjustment: ${selectedProduct?.name}`}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAdjustModalOpen(false)}
              disabled={adjusting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="adjust-form"
              className="btn btn-primary"
              disabled={adjusting}
            >
              {adjusting ? 'Saving Adjustment...' : 'Apply Adjustment'}
            </button>
          </>
        }
      >
        {selectedProduct && (
          <form id="adjust-form" onSubmit={handleSaveAdjustment}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <div><strong>SKU:</strong> {selectedProduct.sku}</div>
              <div><strong>Current Warehouse Balance:</strong> {selectedProduct.currentStock} {selectedProduct.unit}</div>
            </div>

            <div className="form-group">
              <label className="form-label">New Verified Physical Count *</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Adjustment Reason</label>
              <select
                className="form-select"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              >
                <option value="Stock Count Audit">Stock Count Audit (Physical reconciliation)</option>
                <option value="Damaged Goods Write-off">Damaged Goods Write-off</option>
                <option value="Shrinkage / Discrepancy">Shrinkage / Inventory Discrepancy</option>
                <option value="Return to Vendor">Return to Vendor</option>
                <option value="Initial Correction">Initial Count Correction</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Audit Notes</label>
              <textarea
                rows="2"
                className="form-control"
                placeholder="Audit notes or inspection details..."
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
              ></textarea>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default Inventory;
