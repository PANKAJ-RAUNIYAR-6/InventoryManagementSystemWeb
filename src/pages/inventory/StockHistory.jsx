import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, ArrowUpRight, ArrowDownRight, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import './Inventory.css';

export const StockHistory = () => {
  const { addToast } = useNotification();
  const [history, setHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = async () => {
    try {
      const res = await api.getProducts({ limit: 500 });
      if (res.success) setProducts(res.products || []);
    } catch (err) {
      console.warn('Could not load products', err);
    }
  };

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        product: selectedProduct,
        type: selectedType,
        startDate,
        endDate,
      };
      const res = await api.getStockHistory(params);
      if (res.success) {
        setHistory(res.history || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load stock history', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, selectedProduct, selectedType, startDate, endDate, addToast]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getTypeBadge = (type) => {
    switch (type) {
      case 'PURCHASE':
        return (
          <span className="history-badge purchase">
            <ArrowUpRight size={13} /> Stock In (Purchase)
          </span>
        );
      case 'SALE':
        return (
          <span className="history-badge sale">
            <ArrowDownRight size={13} /> Stock Out (Sale)
          </span>
        );
      default:
        return (
          <span className="history-badge adjustment">
            <Sliders size={13} /> Manual Adjustment
          </span>
        );
    }
  };

  return (
    <div className="stock-history-page">
      <div className="page-header-row">
        <div>
          <h2>Stock Movement Audit Log</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Immutable ledger tracking every inventory addition, sale deduction, and adjustment
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="filters-bar">
        <select
          className="form-select filter-select"
          value={selectedProduct}
          onChange={(e) => {
            setSelectedProduct(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} [{p.sku}]
            </option>
          ))}
        </select>

        <select
          className="form-select filter-select"
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Transaction Types</option>
          <option value="PURCHASE">PURCHASE (Stock In)</option>
          <option value="SALE">SALE (Stock Out)</option>
          <option value="ADJUSTMENT">ADJUSTMENT (Audit)</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="date"
            className="form-control"
            title="Start date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
          <span style={{ color: '#94a3b8' }}>to</span>
          <input
            type="date"
            className="form-control"
            title="End date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        <div className="data-table-container">
          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-muted)' }}>Retrieving audit ledger...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <History size={36} />
              <h4>No Movement Records Found</h4>
              <p>Transactions will appear here as stock changes occur.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Activity Type</th>
                  <th>Previous Stock</th>
                  <th>Change Qty</th>
                  <th>New Stock</th>
                  <th>Reference / Note</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => {
                  const isPositive = record.type === 'PURCHASE' || (record.type === 'ADJUSTMENT' && record.newStock > record.previousStock);

                  return (
                    <tr key={record._id}>
                      <td style={{ color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{record.product?.name || 'Deleted Product'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                          <code>{record.product?.sku}</code>
                        </div>
                      </td>
                      <td>{getTypeBadge(record.type)}</td>
                      <td>{record.previousStock}</td>
                      <td>
                        <span className={`stock-change-diff ${isPositive ? 'positive' : 'negative'}`}>
                          {isPositive ? `+${record.quantity}` : `-${record.quantity}`}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {record.newStock} {record.product?.unit || 'pcs'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{record.reference || 'N/A'}</div>
                        {record.notes && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{record.notes}</div>
                        )}
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.85rem' }}>
                        {record.user?.name || 'System Admin'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="pagination-wrap">
            <span className="page-info">
              Showing page {page} of {totalPages} ({totalCount} total audit entries)
            </span>
            <div className="pagination-controls">
              <button
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default StockHistory;
