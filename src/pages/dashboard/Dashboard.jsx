import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Layers,
  Truck,
  Boxes,
  TrendingUp,
  ShoppingBag,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Receipt,
  RotateCw,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './Dashboard.css';

export const Dashboard = () => {
  const { isManager, isStaff } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getDashboardStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading live inventory metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', borderColor: '#fca5a5' }}>
        <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
        <h3 style={{ color: '#b91c1c' }}>Error Loading Dashboard</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchStats}>
          <RotateCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const { stats, lowStockProducts, recentSales, recentPurchases, recentStockHistory, monthlyTrends } = data || {};

  // Find max value in monthlyTrends for scaling bar charts
  const maxBarValue = Math.max(
    100,
    ...(monthlyTrends || []).flatMap((m) => [m.sales, m.purchases, m.profit])
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Inventory Overview</h2>
          <p>Real-time analytics and stock intelligence from MongoDB</p>
        </div>

        <div className="dashboard-actions">
          {isStaff && (
            <Link to="/sales" className="btn btn-primary">
              <ShoppingCart size={16} /> New Sale
            </Link>
          )}
          {isManager && (
            <>
              <Link to="/purchases" className="btn btn-secondary">
                <ShoppingBag size={16} /> New Purchase
              </Link>
              <Link to="/products" className="btn btn-outline">
                <PlusCircle size={16} /> Add Product
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <div className="low-stock-alert-banner">
          <div className="alert-content">
            <AlertTriangle size={24} color="#d97706" />
            <div>
              <h4>Low Stock Attention Required ({lowStockProducts.length} Products)</h4>
              <p>
                Immediate reorder recommended: {lowStockProducts.slice(0, 3).map((p) => `${p.name} (${p.currentStock} left)`).join(', ')}
                {lowStockProducts.length > 3 ? ` and ${lowStockProducts.length - 3} more.` : '.'}
              </p>
            </div>
          </div>
          <Link to="/inventory" className="btn btn-sm btn-secondary" style={{ backgroundColor: '#fef3c7', borderColor: '#fde68a' }}>
            Inspect Inventory
          </Link>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{stats?.totalProducts ?? 0}</span>
            <span className="stat-subtext">{stats?.totalCategories ?? 0} Categories</span>
          </div>
          <div className="stat-icon-wrap stat-icon-blue">
            <Package size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Stock Items</span>
            <span className="stat-value">{stats?.totalStockQuantity ?? 0}</span>
            <span className="stat-subtext">Valuation: ${Number(stats?.totalStockValue || 0).toLocaleString()}</span>
          </div>
          <div className="stat-icon-wrap stat-icon-amber">
            <Boxes size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">${Number(stats?.totalSalesAmount || 0).toLocaleString()}</span>
            <span className="stat-subtext">{stats?.totalSalesCount ?? 0} Invoices</span>
          </div>
          <div className="stat-icon-wrap stat-icon-emerald">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Gross Profit</span>
            <span className="stat-value">${Number(stats?.totalProfit || 0).toLocaleString()}</span>
            <span className="stat-subtext">Purchases: ${Number(stats?.totalPurchasesAmount || 0).toLocaleString()}</span>
          </div>
          <div className="stat-icon-wrap stat-icon-purple">
            <Receipt size={22} />
          </div>
        </div>
      </div>

      {/* Main Charts & Low Stock Panel */}
      <div className="dashboard-columns">
        {/* Performance Chart */}
        <div className="card">
          <div className="card-header">
            <h3>Sales, Purchases & Profit Trends</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Past 6 Months</span>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <div className="chart-bars">
                {(monthlyTrends || []).map((m, idx) => {
                  const salesHeight = Math.max(4, Math.round((m.sales / maxBarValue) * 160));
                  const purchasesHeight = Math.max(4, Math.round((m.purchases / maxBarValue) * 160));
                  const profitHeight = Math.max(4, Math.round((m.profit / maxBarValue) * 160));

                  return (
                    <div key={idx} className="chart-bar-group">
                      <div className="bars-wrapper">
                        <div
                          className="bar-col sales"
                          style={{ height: `${salesHeight}px` }}
                          title={`Sales: $${m.sales}`}
                        />
                        <div
                          className="bar-col purchases"
                          style={{ height: `${purchasesHeight}px` }}
                          title={`Purchases: $${m.purchases}`}
                        />
                        <div
                          className="bar-col profit"
                          style={{ height: `${profitHeight}px` }}
                          title={`Profit: $${m.profit}`}
                        />
                      </div>
                      <span className="chart-label">{m.month}</span>
                    </div>
                  );
                })}
              </div>

              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{ backgroundColor: '#2563eb' }} />
                  <span>Sales Revenue</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ backgroundColor: '#f59e0b' }} />
                  <span>Purchases Cost</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ backgroundColor: '#10b981' }} />
                  <span>Gross Profit</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Items List */}
        <div className="card">
          <div className="card-header">
            <h3>Low Stock Watchlist</h3>
            <span className="badge badge-warning">{lowStockProducts?.length || 0} Items</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="data-table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Stock</th>
                      <th>Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.slice(0, 6).map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sku}</div>
                        </td>
                        <td>
                          <span className={`badge ${item.currentStock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                            {item.currentStock} {item.unit}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.minStockLevel} {item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <Boxes size={32} />
                <p>All products have healthy inventory levels!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Sections */}
      <div className="dashboard-columns-half">
        {/* Recent Sales */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Sales Orders</h3>
            <Link to="/sales" style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: 600 }}>
              View All
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentSales && recentSales.length > 0 ? (
              <div className="data-table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((s) => (
                      <tr key={s._id}>
                        <td style={{ fontWeight: 600, color: '#2563eb' }}>{s.invoiceNumber}</td>
                        <td>{s.customerName}</td>
                        <td style={{ fontWeight: 600 }}>${s.totalAmount.toFixed(2)}</td>
                        <td>{s.items?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <ShoppingCart size={32} />
                <p>No sales registered yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Purchase Orders</h3>
            <Link to="/purchases" style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: 600 }}>
              View All
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentPurchases && recentPurchases.length > 0 ? (
              <div className="data-table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>PO #</th>
                      <th>Supplier</th>
                      <th>Total</th>
                      <th>Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPurchases.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 600, color: '#059669' }}>{p.purchaseNumber}</td>
                        <td>{p.supplier?.company || p.supplier?.name || 'N/A'}</td>
                        <td style={{ fontWeight: 600 }}>${p.totalAmount.toFixed(2)}</td>
                        <td>{p.items?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <ShoppingBag size={32} />
                <p>No purchase orders recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
