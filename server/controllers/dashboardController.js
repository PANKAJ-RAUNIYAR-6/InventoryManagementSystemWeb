import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Supplier from '../models/Supplier.js';
import Purchase from '../models/Purchase.js';
import Sale from '../models/Sale.js';
import StockHistory from '../models/StockHistory.js';
import Notification from '../models/Notification.js';

// @desc    Get comprehensive live dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Core entity counts
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalSuppliers = await Supplier.countDocuments();

    // 2. Stock metrics & low stock products
    const allProducts = await Product.find().select('name sku currentStock minStockLevel unit purchasePrice sellingPrice category');
    
    let totalStockQuantity = 0;
    let totalStockValue = 0;
    const lowStockProducts = [];

    for (const p of allProducts) {
      totalStockQuantity += p.currentStock;
      totalStockValue += p.currentStock * p.purchasePrice;
      if (p.currentStock <= p.minStockLevel) {
        lowStockProducts.push({
          _id: p._id,
          name: p.name,
          sku: p.sku,
          currentStock: p.currentStock,
          minStockLevel: p.minStockLevel,
          unit: p.unit,
          status: p.currentStock === 0 ? 'Out of Stock' : 'Low Stock',
        });
      }
    }

    // 3. Purchase metrics
    const purchases = await Purchase.find().select('totalAmount items createdAt');
    const totalPurchasesCount = purchases.length;
    const totalPurchasesAmount = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    // 4. Sales metrics & profit
    const sales = await Sale.find().select('totalAmount totalProfit items createdAt');
    const totalSalesCount = sales.length;
    const totalSalesAmount = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalProfit = sales.reduce((sum, s) => sum + (s.totalProfit || 0), 0);

    // 5. Recent 5 Sales
    const recentSales = await Sale.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // 6. Recent 5 Purchases
    const recentPurchases = await Purchase.find()
      .populate('supplier', 'name company')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // 7. Recent 5 Stock History changes
    const recentStockHistory = await StockHistory.find()
      .populate('product', 'name sku unit')
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    // 8. Monthly Trends for Chart (Last 6 months)
    const monthlyData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const mSales = sales
        .filter((s) => s.createdAt >= d && s.createdAt < nextMonth)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

      const mPurchases = purchases
        .filter((p) => p.createdAt >= d && p.createdAt < nextMonth)
        .reduce((sum, p) => sum + (p.totalAmount || 0), 0);

      const mProfit = sales
        .filter((s) => s.createdAt >= d && s.createdAt < nextMonth)
        .reduce((sum, s) => sum + (s.totalProfit || 0), 0);

      monthlyData.push({
        month: monthLabel,
        sales: Math.round(mSales * 100) / 100,
        purchases: Math.round(mPurchases * 100) / 100,
        profit: Math.round(mProfit * 100) / 100,
      });
    }

    // 9. Low stock notifications
    const unreadNotifications = await Notification.find({ isRead: false })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalCategories,
        totalSuppliers,
        totalStockQuantity,
        totalStockValue: Math.round(totalStockValue * 100) / 100,
        lowStockCount: lowStockProducts.length,
        totalPurchasesCount,
        totalPurchasesAmount: Math.round(totalPurchasesAmount * 100) / 100,
        totalSalesCount,
        totalSalesAmount: Math.round(totalSalesAmount * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
      },
      lowStockProducts,
      recentSales,
      recentPurchases,
      recentStockHistory,
      monthlyTrends: monthlyData,
      unreadNotifications,
    });
  } catch (err) {
    next(err);
  }
};
