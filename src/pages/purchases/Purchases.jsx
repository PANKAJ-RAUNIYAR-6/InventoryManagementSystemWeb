import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, ShoppingBag, Calendar } from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import CreatePurchaseModal from './CreatePurchaseModal.jsx';
import Modal from '../../components/common/Modal.jsx';
import './Purchases.css';

export const Purchases = () => {
  const { isManager } = useAuth();
  const { addToast } = useNotification();

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewPurchase, setViewPurchase] = useState(null);

  const fetchDependencies = async () => {
    try {
      const [supsRes, prodsRes] = await Promise.all([
        api.getSuppliers(),
        api.getProducts({ limit: 500 }),
      ]);
      if (supsRes.success) setSuppliers(supsRes.suppliers || []);
      if (prodsRes.success) setProducts(prodsRes.products || []);
    } catch (err) {
      console.warn('Failed loading purchase dependencies', err);
    }
  };

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search,
        supplier: selectedSupplier,
        startDate,
        endDate,
      };
      const res = await api.getPurchases(params);
      if (res.success) {
        setPurchases(res.purchases || []);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load purchases', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedSupplier, startDate, endDate, addToast]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  return (
    <div className="purchases-page">
      <div className="page-header-row">
        <div>
          <h2>Purchase Orders (Stock In)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Receive shipments from vendors and automatically restock warehouse inventory
          </p>
        </div>

        {isManager && (
          <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} /> New Purchase Order
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search PO number or items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select filter-select"
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
        >
          <option value="">All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s._id} value={s._id}>
              {s.company || s.name}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="date"
            className="form-control"
            title="Start date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: '#94a3b8' }}>to</span>
          <input
            type="date"
            className="form-control"
            title="End date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Purchases Data Table */}
      <div className="card">
        <div className="data-table-container">
          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-muted)' }}>Loading purchase history...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={36} />
              <h4>No Purchase Records Found</h4>
              <p>Create a purchase order to stock your inventory.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Total Amount</th>
                  <th>Items Count</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {p.purchaseNumber}
                    </td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>{p.supplier ? (p.supplier.company || p.supplier.name) : 'N/A'}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      ${p.totalAmount?.toFixed(2)}
                    </td>
                    <td>{p.items?.length || 0} Products</td>
                    <td>
                      <span className="badge badge-success">{p.status}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setViewPurchase(p)}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Purchase Modal */}
      <CreatePurchaseModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          fetchPurchases();
          fetchDependencies();
          addToast('Purchase order created and stock replenished!', 'success');
        }}
        suppliers={suppliers}
        products={products}
      />

      {/* View Purchase Details Modal */}
      <Modal
        isOpen={!!viewPurchase}
        onClose={() => setViewPurchase(null)}
        title={`Purchase Order: ${viewPurchase?.purchaseNumber}`}
        size="lg"
        footer={
          <button className="btn btn-secondary" onClick={() => setViewPurchase(null)}>
            Close
          </button>
        }
      >
        {viewPurchase && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>SUPPLIER</span>
                <div style={{ fontWeight: 600 }}>{viewPurchase.supplier?.company || viewPurchase.supplier?.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{viewPurchase.supplier?.phone}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ORDER DATE</span>
                <div style={{ fontWeight: 600 }}>{new Date(viewPurchase.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>CREATED BY</span>
                <div style={{ fontWeight: 600 }}>{viewPurchase.createdBy?.name || 'System Admin'}</div>
              </div>
            </div>

            <h4 style={{ marginBottom: '0.75rem' }}>Purchased Items</h4>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>SKU</th>
                    <th>Qty Received</th>
                    <th>Unit Cost</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {viewPurchase.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{it.productName}</td>
                      <td><code>{it.sku}</code></td>
                      <td>{it.quantity}</td>
                      <td>${it.unitPrice?.toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>${it.subtotal?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="purchase-total-box" style={{ marginTop: '1.25rem' }}>
              <span className="total-label">Total Purchase Amount:</span>
              <span className="total-value">${viewPurchase.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Purchases;
