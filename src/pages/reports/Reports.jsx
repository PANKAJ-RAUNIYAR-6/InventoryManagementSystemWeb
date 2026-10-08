import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  ShoppingBag,
  Boxes,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import api from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.jsx';
import './Reports.css';

export const Reports = () => {
  const { addToast } = useNotification();
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'purchases' | 'inventory' | 'profit'
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report Data
  const [reportData, setReportData] = useState(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = { startDate, endDate };
      let res;

      if (activeTab === 'sales') {
        res = await api.getSalesReport(params);
      } else if (activeTab === 'purchases') {
        res = await api.getPurchaseReport(params);
      } else if (activeTab === 'inventory') {
        res = await api.getInventoryReport(params);
      } else if (activeTab === 'profit') {
        res = await api.getProfitReport(params);
      }

      if (res?.success) {
        setReportData(res);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate, addToast]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Export to PDF
  const exportPDF = () => {
    if (!reportData || !reportData.records || reportData.records.length === 0) {
      addToast('No data available to export', 'warning');
      return;
    }

    try {
      const doc = new jsPDF('landscape');
      const titleMap = {
        sales: 'Sales Report',
        purchases: 'Procurement / Purchases Report',
        inventory: 'Inventory Valuation Report',
        profit: 'Profit & Loss Performance Report',
      };
      const title = titleMap[activeTab] || 'Business Report';

      doc.setFontSize(16);
      doc.text(`OptiStock - ${title}`, 14, 18);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Exported on: ${new Date().toLocaleString()}`, 14, 25);
      if (startDate || endDate) {
        doc.text(`Date Filter: ${startDate || 'All'} to ${endDate || 'Present'}`, 14, 30);
      }

      let headers = [];
      let rows = [];

      if (activeTab === 'sales') {
        headers = ['Date', 'Invoice #', 'Customer', 'Product', 'SKU', 'Qty', 'Unit Price ($)', 'Total ($)', 'Payment'];
        rows = reportData.records.map((r) => [
          r.date,
          r.invoiceNumber,
          r.customerName,
          r.productName,
          r.sku,
          r.quantity,
          `$${r.unitPrice?.toFixed(2)}`,
          `$${r.subtotal?.toFixed(2)}`,
          r.paymentMethod,
        ]);
      } else if (activeTab === 'purchases') {
        headers = ['Date', 'PO #', 'Supplier', 'Product', 'SKU', 'Qty', 'Unit Cost ($)', 'Total ($)', 'Creator'];
        rows = reportData.records.map((r) => [
          r.date,
          r.purchaseNumber,
          r.supplierName,
          r.productName,
          r.sku,
          r.quantity,
          `$${r.unitPrice?.toFixed(2)}`,
          `$${r.subtotal?.toFixed(2)}`,
          r.createdBy,
        ]);
      } else if (activeTab === 'inventory') {
        headers = ['Product Name', 'SKU', 'Category', 'Current Stock', 'Min Level', 'Cost Price ($)', 'Selling Price ($)', 'Cost Valuation ($)', 'Status'];
        rows = reportData.records.map((r) => [
          r.productName,
          r.sku,
          r.category,
          `${r.currentStock} ${r.unit}`,
          r.minStockLevel,
          `$${r.purchasePrice?.toFixed(2)}`,
          `$${r.sellingPrice?.toFixed(2)}`,
          `$${r.totalCostValuation?.toFixed(2)}`,
          r.status,
        ]);
      } else if (activeTab === 'profit') {
        headers = ['Product Name', 'SKU', 'Units Sold', 'Revenue ($)', 'COGS ($)', 'Gross Profit ($)', 'Margin (%)'];
        rows = reportData.records.map((r) => [
          r.productName,
          r.sku,
          r.quantitySold,
          `$${r.revenue?.toFixed(2)}`,
          `$${r.cost?.toFixed(2)}`,
          `$${r.profit?.toFixed(2)}`,
          `${r.marginPercent}%`,
        ]);
      }

      autoTable(doc, {
        startY: 35,
        head: [headers],
        body: rows,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [37, 99, 235] },
      });

      doc.save(`OptiStock_${activeTab}_report_${Date.now()}.pdf`);
      addToast('PDF report generated and downloaded!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to export PDF', 'error');
    }
  };

  // Export to Excel
  const exportExcel = () => {
    if (!reportData || !reportData.records || reportData.records.length === 0) {
      addToast('No data available to export', 'warning');
      return;
    }

    try {
      const ws = XLSX.utils.json_to_sheet(reportData.records);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeTab.toUpperCase());
      XLSX.writeFile(wb, `OptiStock_${activeTab}_report_${Date.now()}.xlsx`);
      addToast('Excel workbook exported successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to export Excel', 'error');
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header-row">
        <div>
          <h2>Business Intelligence & Reports</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Comprehensive reporting for sales, procurement, valuation, and profit margins
          </p>
        </div>

        <div className="report-export-buttons">
          <button className="btn btn-outline" onClick={exportPDF}>
            <FileText size={16} /> Export PDF
          </button>
          <button className="btn btn-success" onClick={exportExcel}>
            <FileSpreadsheet size={16} /> Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="report-tabs">
        <button
          className={`report-tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <TrendingUp size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Sales Report
        </button>
        <button
          className={`report-tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          <ShoppingBag size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Purchases Report
        </button>
        <button
          className={`report-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Boxes size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Inventory Valuation
        </button>
        <button
          className={`report-tab-btn ${activeTab === 'profit' ? 'active' : ''}`}
          onClick={() => setActiveTab('profit')}
        >
          <DollarSign size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Profit & Loss
        </button>
      </div>

      {/* Filter toolbar */}
      {activeTab !== 'inventory' && (
        <div className="filters-bar" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
              Date Range:
            </span>
            <input
              type="date"
              className="form-control"
              style={{ width: 'auto' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ color: '#94a3b8' }}>to</span>
            <input
              type="date"
              className="form-control"
              style={{ width: 'auto' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {(startDate || endDate) && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary KPI Bar */}
      {reportData?.summary && (
        <div className="summary-metric-bar">
          {activeTab === 'sales' && (
            <>
              <div className="summary-metric-item">
                <span className="metric-title">Total Revenue</span>
                <span className="metric-number" style={{ color: '#2563eb' }}>
                  ${Number(reportData.summary.totalRevenue || 0).toLocaleString()}
                </span>
              </div>
              <div className="summary-metric-item">
                <span className="metric-title">Gross Profit</span>
                <span className="metric-number" style={{ color: '#059669' }}>
                  ${Number(reportData.summary.totalProfit || 0).toLocaleString()}
                </span>
              </div>
              <div className="summary-metric-item">
                <span className="metric-title">Units Sold</span>
                <span className="metric-number">{reportData.summary.totalItemsSold || 0}</span>
              </div>
              <div className="summary-metric-item">
                <span className="metric-title">Average Order</span>
                <span className="metric-number">${reportData.summary.averageOrderValue || 0}</span>
              </div>
            </>
          )}

          {activeTab === 'purchases' && (
            <>
              <div className="summary-metric-item">
                <span className="metric-title">Total Spent</span>
                <span className="metric-number" style={{ color: '#d97706' }}>
                  ${Number(reportData.summary.totalSpent || 0).toLocaleString()}
                </span>
              </div>
              <div className="summary-metric-item">
                <span className="metric-title">PO Count</span>
                <span className="metric-number">{reportData.summary.totalPurchaseOrders || 0}</span>
              </div>
              <div className="summary-metric-item">
                <span className="metric-title">Units Purchased</span>
                <span className="metric-number">{reportData.summary.totalItemsPurchased || 0}</span>
              </div>
            </>
          )}

          {activeTab === 'inventory' && (
            <>
              <div className="summary-metric-item">
                <span className="metric-title">Cost Valuation</span>
                <span className="metric-number">
                  ${Number(reportData.summary.totalCostValuation || 0).toLocaleString()}
                </span>
              </div>
              <div className="summary-metric-item">
                <span className="metric-title">Retail Valuation</span>
                <span className="metric-number" style={{ color: '#2563eb' }}>
                  ${Number(reportData.summary.totalRetailValuation || 0).toLocaleString()}
                </span>
              </div>
              <div className="summary-metric-item">
                <span className="metric-title">Projected Margin</span>
                <span className="metric-number" style={{ color: '#059669' }}>
                  ${Number(reportData.summary.projectedMargin || 0).toLocaleString()}
                </span>
              </div>
              <div className="summary-metric-item">
                <span className="metric-title">Low Stock Items</span>
                <span className="metric-number" style={{ color: '#dc2626' }}>
                  {reportData.summary.lowStockCount || 0}
                </span>
              </div>
            </>
          )}

          {activeTab === 'profit' && (
            <>
              <div className="summary-metric-item">
                <span className="metric-title">Total Revenue</span>
                <span className="metric-number" style={{ color: '#2563eb' }}>
                  ${Number(reportData.summary.totalRevenue || 0).toLocaleString()}
                </span>
              </div>
              <div className="summary-metric-item">
                <span className="metric-title">Cost of Goods (COGS)</span>
                <span className="metric-number" style={{ color: '#64748b' }}>
                  ${Number(reportData.summary.totalCostOfGoodsSold || 0).toLocaleString()}
                </span>
              </div>
              <div className="summary-metric-item">
                <span className="metric-title">Net Gross Profit</span>
                <span className="metric-number" style={{ color: '#059669' }}>
                  ${Number(reportData.summary.totalGrossProfit || 0).toLocaleString()}
                </span>
              </div>
              <div className="summary-metric-item">
                <span className="metric-title">Overall Margin %</span>
                <span className="metric-number">{reportData.summary.profitMarginPercent}%</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Report Records Table */}
      <div className="card">
        <div className="data-table-container">
          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-muted)' }}>Compiling database report...</p>
            </div>
          ) : !reportData?.records || reportData.records.length === 0 ? (
            <div className="empty-state">
              <FileText size={36} />
              <h4>No Report Records Found</h4>
              <p>There are no transactions or records matching the specified criteria.</p>
            </div>
          ) : (
            <table className="data-table">
              {activeTab === 'sales' && (
                <>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.records.map((r, i) => (
                      <tr key={i}>
                        <td>{r.date}</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{r.invoiceNumber}</td>
                        <td>{r.customerName}</td>
                        <td style={{ fontWeight: 500 }}>{r.productName}</td>
                        <td><code>{r.sku}</code></td>
                        <td>{r.quantity}</td>
                        <td>${r.unitPrice?.toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>${r.subtotal?.toFixed(2)}</td>
                        <td><span className="badge badge-info">{r.paymentMethod}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'purchases' && (
                <>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>PO #</th>
                      <th>Supplier</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Unit Cost</th>
                      <th>Subtotal</th>
                      <th>Authorized By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.records.map((r, i) => (
                      <tr key={i}>
                        <td>{r.date}</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{r.purchaseNumber}</td>
                        <td>{r.supplierName}</td>
                        <td style={{ fontWeight: 500 }}>{r.productName}</td>
                        <td><code>{r.sku}</code></td>
                        <td>{r.quantity}</td>
                        <td>${r.unitPrice?.toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>${r.subtotal?.toFixed(2)}</td>
                        <td>{r.createdBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'inventory' && (
                <>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Current Stock</th>
                      <th>Unit Cost</th>
                      <th>Retail Price</th>
                      <th>Total Cost Valuation</th>
                      <th>Retail Valuation</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.records.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{r.productName}</td>
                        <td><code>{r.sku}</code></td>
                        <td>{r.category}</td>
                        <td style={{ fontWeight: 600 }}>{r.currentStock} {r.unit}</td>
                        <td>${r.purchasePrice?.toFixed(2)}</td>
                        <td>${r.sellingPrice?.toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>${r.totalCostValuation?.toFixed(2)}</td>
                        <td style={{ fontWeight: 600, color: '#2563eb' }}>${r.totalRetailValuation?.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${r.status === 'Out of Stock' ? 'badge-danger' : r.status === 'Low Stock' ? 'badge-warning' : 'badge-success'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'profit' && (
                <>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Units Sold</th>
                      <th>Revenue ($)</th>
                      <th>COGS Cost ($)</th>
                      <th>Gross Profit ($)</th>
                      <th>Profit Margin (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.records.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{r.productName}</td>
                        <td><code>{r.sku}</code></td>
                        <td>{r.quantitySold}</td>
                        <td style={{ fontWeight: 600 }}>${r.revenue?.toFixed(2)}</td>
                        <td>${r.cost?.toFixed(2)}</td>
                        <td style={{ fontWeight: 700, color: r.profit >= 0 ? '#059669' : '#dc2626' }}>
                          ${r.profit?.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${r.marginPercent >= 20 ? 'badge-success' : 'badge-warning'}`}>
                            {r.marginPercent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
export default Reports;
