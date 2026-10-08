import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, ShoppingCart, Printer } from 'lucide-react';
import api from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import CreateSaleModal from './CreateSaleModal.jsx';
import Modal from '../../components/common/Modal.jsx';
import './Sales.css';

export const Sales = () => {
  const { addToast } = useNotification();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewSale, setViewSale] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await api.getProducts({ limit: 500 });
      if (res.success) setProducts(res.products || []);
    } catch (err) {
      console.warn('Could not load products', err);
    }
  };

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search,
        paymentMethod,
        startDate,
        endDate,
      };
      const res = await api.getSales(params);
      if (res.success) {
        setSales(res.sales || []);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load sales list', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, paymentMethod, startDate, endDate, addToast]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return (
    <div className="sales-page">
      <div className="page-header-row">
        <div>
          <h2>Sales & Invoicing (POS)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Process customer checkout and automatically reduce inventory on completion
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
          <Plus size={16} /> New Sale Transaction
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search invoice number, customer name, phone, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select filter-select"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="">All Payment Types</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="UPI/Transfer">UPI / Transfer</option>
          <option value="Credit">Credit</option>
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

      {/* Sales Invoices Table */}
      <div className="card">
        <div className="data-table-container">
          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-muted)' }}>Retrieving sales records...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart size={36} />
              <h4>No Sales Transactions Recorded</h4>
              <p>Process your first sale order using the button above.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th>Total Amount</th>
                  <th>Profit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {s.invoiceNumber}
                    </td>
                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{s.customerName}</div>
                      {s.customerPhone && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {s.customerPhone}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info">{s.paymentMethod}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      ${s.totalAmount?.toFixed(2)}
                    </td>
                    <td style={{ fontWeight: 600, color: '#059669' }}>
                      ${(s.totalProfit || 0).toFixed(2)}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setViewSale(s)}
                      >
                        <Eye size={14} /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Point of Sale Modal */}
      <CreateSaleModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          fetchSales();
          fetchProducts();
          addToast('Sale recorded successfully! Stock deducted.', 'success');
        }}
        products={products}
      />

      {/* Invoice Receipt Modal */}
      <Modal
        isOpen={!!viewSale}
        onClose={() => setViewSale(null)}
        title={`Invoice Receipt: ${viewSale?.invoiceNumber}`}
        size="md"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => window.print()}>
              <Printer size={15} /> Print
            </button>
            <button className="btn btn-secondary" onClick={() => setViewSale(null)}>
              Close
            </button>
          </>
        }
      >
        {viewSale && (
          <div className="receipt-box">
            <div className="receipt-header">
              <h3 style={{ margin: 0, color: '#0f172a' }}>OptiStock Retail</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Inventory & Sales Receipt
              </p>
              <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>
                {viewSale.invoiceNumber}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {new Date(viewSale.createdAt).toLocaleString()}
              </div>
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div><strong>Customer:</strong> {viewSale.customerName}</div>
              {viewSale.customerPhone && (
                <div><strong>Phone:</strong> {viewSale.customerPhone}</div>
              )}
              <div><strong>Payment:</strong> {viewSale.paymentMethod}</div>
              <div><strong>Served By:</strong> {viewSale.createdBy?.name || 'Staff'}</div>
            </div>

            <table className="data-table" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {viewSale.items?.map((it, i) => (
                  <tr key={i}>
                    <td>
                      <div>{it.productName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{it.sku}</div>
                    </td>
                    <td>{it.quantity}</td>
                    <td>${it.unitPrice?.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>${it.subtotal?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '2px solid #0f172a', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
              <span>Total Paid:</span>
              <span>${viewSale.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Sales;
