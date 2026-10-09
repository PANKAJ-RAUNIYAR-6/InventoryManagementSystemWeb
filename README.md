# OptiStock - Enterprise Full-Stack Inventory Management System

OptiStock is a full-stack inventory and warehouse management system built with **React.js, Node.js, Express.js, MongoDB, Mongoose, and CSS3**.

The system helps businesses manage products, categories, suppliers, purchases, sales, stock adjustments, inventory history, notifications, users, dashboards, and business reports from a single application.

---

## 🌐 Live Demo

👉 [View Live Website](https://inventorymanagementsystemweb.onrender.com)

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Technology Stack](#-technology-stack)
4. [Project Architecture](#-project-architecture)
5. [Prerequisites](#-prerequisites)
6. [MongoDB Setup](#-mongodb-setup)
7. [Environment Variables](#-environment-variables)
8. [Installation](#-installation)
9. [Database Initialization](#-database-initialization)
10. [Running the Application](#-running-the-application)
11. [Initial Admin Login](#-initial-admin-login)
12. [Application Modules](#-application-modules)
13. [Role-Based Access Control](#-role-based-access-control)
14. [REST API](#-rest-api)
15. [Reports and Export](#-reports-and-export)
16. [Inventory Workflow](#-inventory-workflow)
17. [Troubleshooting](#-troubleshooting)
18. [Production Notes](#-production-notes)

---

# 🌟 Project Overview

OptiStock is designed to simplify warehouse and inventory operations.

The application provides:

* Product management
* Category management
* Supplier management
* Purchase order management
* Point of Sale (POS)
* Automatic stock-in and stock-out
* Manual stock adjustments
* Stock history and audit tracking
* Low-stock notifications
* Dashboard analytics
* Sales and purchase reports
* Inventory valuation
* Profit and loss reporting
* PDF and Excel exports
* User management
* Role-based access control
* Responsive interface for desktop, tablet, and mobile

All major inventory transactions are connected to the backend and stored in MongoDB.

---

# 🚀 Features

## 🔐 Authentication & Security

* JWT-based authentication
* Secure password hashing using bcryptjs
* Login and registration
* Protected routes
* Bearer token authentication
* Role-based authorization
* Password change functionality
* Persistent authentication state

## 👤 User Management

Supported roles:

* Admin
* Inventory Manager
* Staff

Administrators can manage users and their assigned roles.

## 📦 Product Management

* Create products
* Edit products
* Delete/deactivate products
* Unique SKU/code validation
* Category assignment
* Supplier assignment
* Purchase cost
* Selling price
* Unit of measurement
* Initial stock
* Minimum stock threshold
* Product status
* Product descriptions/specifications

## 🗂️ Category Management

* Create categories
* Edit categories
* Delete categories
* Active/inactive status
* Product count per category
* Duplicate category protection
* Category deletion protection when products are associated

## 🏢 Supplier Management

* Add suppliers
* Edit suppliers
* Delete suppliers
* Supplier contact information
* Supplier address
* Supplier status
* Supplier purchase history

## 🛒 Purchase Orders

Purchase orders support:

* Supplier selection
* Multiple products per purchase
* Quantity
* Unit cost
* Automatic subtotal calculation
* Grand total calculation
* Invoice/reference number
* Purchase notes

When a purchase is completed:

**Purchase → Stock Increase → Stock History**

## 💳 Sales / POS

Sales functionality includes:

* Customer information
* Multiple products
* Quantity validation
* Available stock validation
* Automatic subtotal calculation
* Payment method selection
* Grand total calculation
* Stock deduction
* Sales invoice history

The system prevents users from selling more stock than is currently available.

When a sale is completed:

**Sale → Stock Decrease → Stock History**

## 📊 Inventory Management

* Current stock balance
* Inventory valuation
* Low-stock detection
* Stock adjustment
* Physical stock reconciliation
* Damaged goods write-off
* Shrinkage/inventory discrepancy
* Return to vendor
* Initial stock correction
* Complete stock movement history

## 🔔 Notifications

The application supports notifications for:

* Low-stock products
* Inventory transactions
* Important stock events

## 📈 Dashboard

The dashboard provides real-time business information such as:

* Total products
* Inventory valuation
* Total revenue
* Gross profit
* Monthly sales information
* Low-stock products
* Recent transactions
* Inventory statistics

## 📑 Reports

Available reports include:

* Sales Report
* Purchase Report
* Inventory Valuation Report
* Profit & Loss Report

Reports support date filtering and exporting.

## 📄 PDF & Excel Export

Users can export reports as:

* PDF
* Excel (`.xlsx`)

---

# 💻 Technology Stack

## Frontend

* React.js 19
* Vite
* JavaScript
* JSX
* React Router DOM
* Lucide React
* CSS3
* Responsive CSS
* jsPDF
* jsPDF AutoTable
* SheetJS / XLSX

## Backend

* Node.js
* Express.js
* JavaScript ES Modules
* JWT
* bcryptjs
* dotenv
* CORS

## Database

* MongoDB
* Mongoose
* MongoDB Memory Server support

---

# 📂 Project Architecture

```text
inventory-management-system/
│
├── server/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── dashboardController.js
│   │   ├── inventoryController.js
│   │   ├── notificationController.js
│   │   ├── productController.js
│   │   ├── purchaseController.js
│   │   ├── reportController.js
│   │   ├── saleController.js
│   │   ├── supplierController.js
│   │   └── userController.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── error.js
│   │   └── role.js
│   │
│   ├── models/
│   │   ├── Category.js
│   │   ├── Notification.js
│   │   ├── Product.js
│   │   ├── Purchase.js
│   │   ├── Sale.js
│   │   ├── StockHistory.js
│   │   ├── Supplier.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── productRoutes.js
│   │   ├── purchaseRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── saleRoutes.js
│   │   ├── supplierRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── seedAdmin.js
│   │
│   ├── app.js
│   └── server.js
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   └── layout/
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── suppliers/
│   │   ├── purchases/
│   │   ├── sales/
│   │   ├── inventory/
│   │   ├── reports/
│   │   └── users/
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .env.example
├── .env
├── index.html
├── metadata.json
├── package.json
├── server.js
├── vite.config.js
└── README.md
```

---

# ⚙️ Prerequisites

Before installing OptiStock, make sure the following are installed.

### Node.js

Node.js **18 or higher** is recommended.

Check your version:

```bash
node -v
```

### npm

Check npm:

```bash
npm -v
```

### MongoDB

You can use either:

* Local MongoDB Community Server
* MongoDB Atlas

---

# 🍃 MongoDB Setup

## Option 1 — Local MongoDB

Install MongoDB Community Server on your computer.

After installation, verify MongoDB:

```bash
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

You should receive a successful connection response.

### Windows

Check MongoDB service:

```powershell
Get-Service MongoDB
```

If it is stopped:

```powershell
Start-Service MongoDB
```

Then verify:

```powershell
mongosh
```

Inside MongoDB Shell:

```javascript
show dbs
```

---

# 🔐 Environment Variables

Create a `.env` file in the **root project directory**, next to `package.json`.

Example:

```env
# Server & Database Configuration
PORT=3000

MONGODB_URI=mongodb://127.0.0.1:27017/InventoryManagementSystemWeb

JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d

# Initial Admin Credentials
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin_email
ADMIN_PASSWORD=admin_email_password

# Client Configuration
CLIENT_URL=http://localhost:3000
VITE_API_URL=/api
```

### Important

Do **not** upload the real `.env` file to GitHub.

Add `.env` to `.gitignore`:

```text
.env
node_modules/
dist/
```

Use `.env.example` for sharing the required variable names.

Example `.env.example`:

```env
PORT=3000

MONGODB_URI=mongodb://127.0.0.1:27017/InventoryManagementSystemWeb

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin_email_id
ADMIN_PASSWORD=admin_email_password

CLIENT_URL=http://localhost:3000
VITE_API_URL=/api
```

---

# 📦 Installation

Clone or download the project and open the project directory.

```bash
cd InventoryManagementSystemWeb-main
```

Install all dependencies:

```bash
npm install
```

If npm reports a peer-dependency conflict between Vite and esbuild, use:

```bash
npm install --legacy-peer-deps
```

After successful installation, `node_modules` will be created.

---

# 🗄️ Database Initialization

OptiStock uses MongoDB through Mongoose.

The database name is determined by the database name in `MONGODB_URI`.

For example:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/InventoryManagementSystemWeb
```

This uses:

```text
Database: InventoryManagementSystemWeb
```

MongoDB creates the database and collections when the application successfully connects and stores documents.

The application can create collections such as:

```text
users
products
categories
suppliers
purchases
sales
stockhistories
notifications
```

The exact collection names depend on the Mongoose models used by the application.

---

# ▶️ Running the Application

OptiStock uses a unified full-stack server.

Start the application with:

```bash
npm run dev
```

The server runs on:

```text
http://localhost:3000
```

Open the URL in your browser:

```text
http://localhost:3000
```

---

# 🔑 Initial Admin Login

The administrator account is created from the values in `.env` when the application initializes the admin seed.

Current example credentials:

```text
Email: admin_email_id
Password: admin_email_password
Role: Admin
```

### Security Recommendation

For production, change the default password and use a strong randomly generated JWT secret.

---

# 🧩 Application Modules

After logging in, the application provides access to modules depending on the user's role.

### Dashboard

Provides:

* Inventory KPIs
* Revenue
* Gross profit
* Stock information
* Low-stock products
* Recent transactions
* Monthly statistics

### Products

Manage:

* Product name
* SKU
* Category
* Supplier
* Purchase cost
* Selling price
* Stock
* Unit
* Minimum stock level
* Status
* Description

### Categories

Manage product categories and monitor associated product counts.

### Suppliers

Manage vendor information and supplier-related purchase history.

### Purchases

Create purchase orders and automatically increase warehouse stock.

### Sales

Create customer sales and automatically decrease warehouse stock.

### Inventory

Monitor current stock, inventory valuation and stock movement history.

### Reports

Generate:

* Sales reports
* Purchase reports
* Inventory reports
* Profit & Loss reports

### Users

Administrators can manage application users and roles.

---

# 🛡️ Role-Based Access Control

| Feature                  | Admin | Inventory Manager | Staff |
| ------------------------ | :---: | :---------------: | :---: |
| Dashboard                |   ✅   |         ✅         |   ✅   |
| View Products            |   ✅   |         ✅         |   ✅   |
| Create Sales             |   ✅   |         ✅         |   ✅   |
| Add/Edit/Delete Products |   ✅   |         ✅         |   ❌   |
| Category Management      |   ✅   |         ✅         |   ❌   |
| Supplier Management      |   ✅   |         ✅         |   ❌   |
| Purchase Orders          |   ✅   |         ✅         |   ❌   |
| Stock Adjustments        |   ✅   |         ✅         |   ❌   |
| Reports & Export         |   ✅   |         ✅         |   ❌   |
| User Management          |   ✅   |         ❌         |   ❌   |

---

# 📡 REST API

## Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/change-password
```

## Products

```text
GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id
```

## Categories

```text
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

## Suppliers

```text
GET    /api/suppliers
POST   /api/suppliers
GET    /api/suppliers/:id
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id
```

## Purchases

```text
GET    /api/purchases
POST   /api/purchases
GET    /api/purchases/:id
```

## Sales

```text
GET    /api/sales
POST   /api/sales
GET    /api/sales/:id
```

## Inventory

```text
GET    /api/inventory
GET    /api/inventory/history
POST   /api/inventory/adjust
```

## Dashboard

```text
GET    /api/dashboard/stats
```

## Reports

```text
GET    /api/reports/sales
GET    /api/reports/purchases
GET    /api/reports/inventory
GET    /api/reports/profit
```

---

# 🔄 Inventory Workflow

OptiStock maintains stock automatically.

### Purchase

```text
Create Purchase
      ↓
Purchase Saved
      ↓
Product Stock Increased
      ↓
Stock History Created
      ↓
Dashboard Updated
```

### Sale

```text
Create Sale
      ↓
Check Available Stock
      ↓
Sale Saved
      ↓
Product Stock Decreased
      ↓
Stock History Created
      ↓
Dashboard Updated
```

### Manual Adjustment

```text
Physical Count
      ↓
Enter Verified Quantity
      ↓
Select Adjustment Reason
      ↓
Stock Updated
      ↓
Audit History Created
```

---

# 📄 Reports & Export

Go to:

```text
Reports & Export
```

Available report types:

* Sales
* Purchases
* Inventory
* Profit & Loss

Users can:

1. Select a report.
2. Select a date range.
3. Review the generated data.
4. Export the report as PDF.
5. Export the report as Excel.

---

# 🔧 Troubleshooting

## `npm install` gives ENOSPC

If you receive:

```text
npm error ENOSPC
npm error nospc
```

your system does not have enough disk space.

Clean npm cache:

```powershell
npm cache clean --force
```

You can also move npm cache to another drive:

```powershell
mkdir E:\npm-cache
npm config set cache "E:\npm-cache" --global
```

Verify:

```powershell
npm config get cache
```

---

## Vite / esbuild dependency conflict

If you receive an `ERESOLVE` error involving Vite and esbuild:

```bash
npm install --legacy-peer-deps
```

---

## MongoDB Connection Failed

Check MongoDB:

```powershell
Get-Service MongoDB
```

Start it if necessary:

```powershell
Start-Service MongoDB
```

Then test:

```bash
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

Also verify that `.env` contains the correct:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/InventoryManagementSystemWeb
```

---

## Port 3000 Already in Use

If port 3000 is already being used, stop the process or change:

```env
PORT=3001
```

Then restart:

```bash
npm run dev
```

---

## Admin Login Not Working

Verify the credentials in `.env`:

```env
ADMIN_EMAIL=admin_email_id
ADMIN_PASSWORD=admin_password
```

Restart the server after changing environment variables.

---

## Duplicate Category Error

If the API returns:

```text
Category with this name already exists
```

the category already exists in the database.

Use a different category name or edit the existing category.

---

# 🚀 Production Notes

Before deploying OptiStock to production:

* Use MongoDB Atlas or a production MongoDB server.
* Use a strong JWT secret.
* Use a strong admin password.
* Never expose `.env` in GitHub.
* Configure production `CLIENT_URL`.
* Configure the production API URL.
* Enable HTTPS.
* Review CORS configuration.
* Run security and dependency audits.
* Use production environment variables.
* Back up the MongoDB database regularly.

---

# 📌 Available NPM Commands

```bash
# Start development/full-stack server
npm run dev

# Start application
npm start

# Create production frontend build
npm run build

# Preview Vite production build
npm run preview

# Dependency installation
npm install
```

If npm dependency resolution reports a Vite/esbuild peer conflict:

```bash
npm install --legacy-peer-deps
```

---

# 👨‍💻 Project Summary

**OptiStock** provides a complete inventory management workflow covering:

```text
Authentication
     ↓
Users & Roles
     ↓
Categories
     ↓
Suppliers
     ↓
Products
     ↓
Purchases ──→ Stock In
     ↓
Inventory
     ↓
Sales ──────→ Stock Out
     ↓
Stock History
     ↓
Dashboard
     ↓
Reports
     ↓
PDF / Excel Export
```

The application is built as a full-stack system where the React frontend communicates with the Express/Node.js backend APIs, while MongoDB provides persistent data storage.
