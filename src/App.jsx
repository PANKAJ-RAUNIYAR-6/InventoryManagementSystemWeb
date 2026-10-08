import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';

// Pages
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import Products from './pages/products/Products.jsx';
import Categories from './pages/categories/Categories.jsx';
import Suppliers from './pages/suppliers/Suppliers.jsx';
import Purchases from './pages/purchases/Purchases.jsx';
import Sales from './pages/sales/Sales.jsx';
import Inventory from './pages/inventory/Inventory.jsx';
import StockHistory from './pages/inventory/StockHistory.jsx';
import Reports from './pages/reports/Reports.jsx';
import Users from './pages/users/Users.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Product Inventory */}
              <Route path="products" element={<Products />} />

              {/* Categories (Manager / Admin) */}
              <Route
                path="categories"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Inventory Manager']}>
                    <Categories />
                  </ProtectedRoute>
                }
              />

              {/* Suppliers (Manager / Admin) */}
              <Route
                path="suppliers"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Inventory Manager']}>
                    <Suppliers />
                  </ProtectedRoute>
                }
              />

              {/* Purchases (Manager / Admin) */}
              <Route
                path="purchases"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Inventory Manager']}>
                    <Purchases />
                  </ProtectedRoute>
                }
              />

              {/* Sales (Staff, Manager, Admin) */}
              <Route path="sales" element={<Sales />} />

              {/* Inventory & Stock History */}
              <Route path="inventory" element={<Inventory />} />
              <Route path="inventory/history" element={<StockHistory />} />

              {/* Reports (Manager / Admin) */}
              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Inventory Manager']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* Users (Admin Only) */}
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
