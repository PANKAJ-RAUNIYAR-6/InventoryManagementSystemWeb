import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import ProductFormModal from './ProductFormModal.jsx';
import './Products.css';

export const Products = () => {
  const { isManager } = useAuth();
  const { addToast } = useNotification();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchDependencies = async () => {
    try {
      const [catsRes, supsRes] = await Promise.all([
        api.getCategories(),
        api.getSuppliers(),
      ]);
      if (catsRes.success) setCategories(catsRes.categories || []);
      if (supsRes.success) setSuppliers(supsRes.suppliers || []);
    } catch (err) {
      console.warn('Error fetching categories or suppliers', err);
    }
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        search,
        category: selectedCategory,
        stockStatus,
      };
      const res = await api.getProducts(params);
      if (res.success) {
        setProducts(res.products || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, stockStatus, addToast]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setModalOpen(true);
  };

  const handleDelete = async (prod) => {
    if (!window.confirm(`Are you sure you want to delete or deactivate '${prod.name}'?`)) {
      return;
    }

    try {
      const res = await api.deleteProduct(prod._id);
      addToast(res.message || 'Product removed successfully', 'success');
      fetchProducts();
    } catch (err) {
      addToast(err.message || 'Could not delete product', 'error');
    }
  };

  return (
    <div className="products-page">
      <div className="page-header-row">
        <div>
          <h2>Product Inventory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Manage warehouse SKUs, pricing, categories, and real-time stock levels
          </p>
        </div>

        {isManager && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by product name, SKU, or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="form-select filter-select"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="form-select filter-select"
          value={stockStatus}
          onChange={(e) => {
            setStockStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Stock Statuses</option>
          <option value="in_stock">In Stock (Healthy)</option>
          <option value="low_stock">Low Stock (Threshold)</option>
          <option value="out_of_stock">Out of Stock (Zero)</option>
        </select>
      </div>

      {/* Products Table Card */}
      <div className="card" style={{ marginBottom: 0 }}>
        <div className="data-table-container">
          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-muted)' }}>Retrieving products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <Package size={36} />
              <h4>No Products Found</h4>
              <p>Try adjusting your search criteria or add your first product.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Cost / Price</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                  {isManager && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => {
                  const isLow = prod.currentStock <= prod.minStockLevel && prod.currentStock > 0;
                  const isOut = prod.currentStock === 0;

                  return (
                    <tr key={prod._id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {prod.sku}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{prod.name}</div>
                        {prod.supplier && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Supplier: {prod.supplier.company || prod.supplier.name}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-secondary">
                          {prod.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>Sell: ${prod.sellingPrice?.toFixed(2)}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Cost: ${prod.purchasePrice?.toFixed(2)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            className={`badge ${
                              isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'
                            }`}
                          >
                            {isLow && <AlertTriangle size={12} />}
                            {prod.currentStock} {prod.unit}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                          Min: {prod.minStockLevel} {prod.unit}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            prod.status === 'active' ? 'badge-info' : 'badge-secondary'
                          }`}
                        >
                          {prod.status}
                        </span>
                      </td>
                      {isManager && (
                        <td>
                          <div className="actions-cell">
                            <button
                              className="action-icon-btn"
                              title="Edit product"
                              onClick={() => handleOpenEdit(prod)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="action-icon-btn delete"
                              title="Delete product"
                              onClick={() => handleDelete(prod)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
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
              Showing page {page} of {totalPages} ({totalCount} total products)
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

      {/* Add / Edit Modal */}
      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editingProduct}
        categories={categories}
        suppliers={suppliers}
        onSaved={fetchProducts}
      />
    </div>
  );
};
export default Products;
