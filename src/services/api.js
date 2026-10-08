const BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  getToken() {
    return localStorage.getItem('ims_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('ims_token', token);
    } else {
      localStorage.removeItem('ims_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // If 401 Unauthorized, notify or clear session if token invalid
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          localStorage.removeItem('ims_token');
          localStorage.removeItem('ims_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        const error = new Error(data.message || 'API request failed');
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
      throw err;
    }
  }

  // --- Auth Endpoints ---
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // --- Products Endpoints ---
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Categories Endpoints ---
  async getCategories(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/categories${query ? `?${query}` : ''}`);
  }

  async createCategory(categoryData) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id, categoryData) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Suppliers Endpoints ---
  async getSuppliers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/suppliers${query ? `?${query}` : ''}`);
  }

  async getSupplier(id) {
    return this.request(`/suppliers/${id}`);
  }

  async createSupplier(supplierData) {
    return this.request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  }

  async updateSupplier(id, supplierData) {
    return this.request(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    });
  }

  async deleteSupplier(id) {
    return this.request(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Purchases Endpoints ---
  async getPurchases(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/purchases${query ? `?${query}` : ''}`);
  }

  async getPurchase(id) {
    return this.request(`/purchases/${id}`);
  }

  async createPurchase(purchaseData) {
    return this.request('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    });
  }

  // --- Sales Endpoints ---
  async getSales(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/sales${query ? `?${query}` : ''}`);
  }

  async getSale(id) {
    return this.request(`/sales/${id}`);
  }

  async createSale(saleData) {
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  // --- Inventory Endpoints ---
  async getInventorySummary() {
    return this.request('/inventory');
  }

  async getStockHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/inventory/history${query ? `?${query}` : ''}`);
  }

  async adjustStock(adjustmentData) {
    return this.request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(adjustmentData),
    });
  }

  // --- Dashboard Endpoints ---
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // --- Reports Endpoints ---
  async getSalesReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/sales${query ? `?${query}` : ''}`);
  }

  async getPurchaseReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/purchases${query ? `?${query}` : ''}`);
  }

  async getInventoryReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/inventory${query ? `?${query}` : ''}`);
  }

  async getProfitReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/profit${query ? `?${query}` : ''}`);
  }

  // --- Notifications Endpoints ---
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // --- Users Endpoints (Admin only) ---
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
export default api;
