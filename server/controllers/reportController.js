import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';
import Product from '../models/Product.js';

// Helper to build date range
const buildDateFilter = (startDate, endDate) => {
  if (!startDate && !endDate) return null;
  const filter = {};
  if (startDate) {
    filter.$gte = new Date(startDate);
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.$lte = end;
  }
  return filter;
};

// @desc    Sales Report
// @route   GET /api/reports/sales
// @access  Private
export const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, paymentMethod } = req.query;
    let query = {};

    const dateFilter = buildDateFilter(startDate, endDate);
    if (dateFilter) {
      query.createdAt = dateFilter;
    }
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    const sales = await Sale.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    let totalRevenue = 0;
    let totalProfit = 0;
    let totalItemsSold = 0;

    const rows = [];
    sales.forEach((s) => {
      totalRevenue += s.totalAmount || 0;
      totalProfit += s.totalProfit || 0;

      s.items.forEach((item) => {
        totalItemsSold += item.quantity || 0;
        rows.push({
          date: new Date(s.createdAt).toLocaleDateString(),
          invoiceNumber: s.invoiceNumber,
          customerName: s.customerName,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          paymentMethod: s.paymentMethod,
          createdBy: s.createdBy ? s.createdBy.name : 'System',
        });
      });
    });

    res.status(200).json({
      success: true,
      summary: {
        totalInvoices: sales.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalItemsSold,
        averageOrderValue: sales.length ? Math.round((totalRevenue / sales.length) * 100) / 100 : 0,
      },
      records: rows,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Purchase Report
// @route   GET /api/reports/purchases
// @access  Private
export const getPurchaseReport = async (req, res, next) => {
  try {
    const { startDate, endDate, supplier } = req.query;
    let query = {};

    const dateFilter = buildDateFilter(startDate, endDate);
    if (dateFilter) {
      query.createdAt = dateFilter;
    }
    if (supplier) {
      query.supplier = supplier;
    }

    const purchases = await Purchase.find(query)
      .populate('supplier', 'name company')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    let totalSpent = 0;
    let totalItemsPurchased = 0;

    const rows = [];
    purchases.forEach((p) => {
      totalSpent += p.totalAmount || 0;

      p.items.forEach((item) => {
        totalItemsPurchased += item.quantity || 0;
        rows.push({
          date: new Date(p.createdAt).toLocaleDateString(),
          purchaseNumber: p.purchaseNumber,
          supplierName: p.supplier ? (p.supplier.company || p.supplier.name) : 'N/A',
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          createdBy: p.createdBy ? p.createdBy.name : 'System',
        });
      });
    });

    res.status(200).json({
      success: true,
      summary: {
        totalPurchaseOrders: purchases.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalItemsPurchased,
        averageOrderValue: purchases.length ? Math.round((totalSpent / purchases.length) * 100) / 100 : 0,
      },
      records: rows,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Inventory Valuation & Stock Status Report
// @route   GET /api/reports/inventory
// @access  Private
export const getInventoryReport = async (req, res, next) => {
  try {
    const { category, stockStatus } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    if (stockStatus === 'out_of_stock') {
      query.currentStock = { $lte: 0 };
    } else if (stockStatus === 'low_stock') {
      query.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
      query.currentStock = { $gt: 0 };
    } else if (stockStatus === 'in_stock') {
      query.$expr = { $gt: ['$currentStock', '$minStockLevel'] };
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('supplier', 'name company')
      .sort({ name: 1 });

    let totalQuantity = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const rows = products.map((p) => {
      totalQuantity += p.currentStock;
      const costVal = p.currentStock * p.purchasePrice;
      const retailVal = p.currentStock * p.sellingPrice;
      totalCostValuation += costVal;
      totalRetailValuation += retailVal;

      let status = 'In Stock';
      if (p.currentStock === 0) {
        status = 'Out of Stock';
        outOfStockCount++;
      } else if (p.currentStock <= p.minStockLevel) {
        status = 'Low Stock';
        lowStockCount++;
      }

      return {
        productName: p.name,
        sku: p.sku,
        category: p.category ? p.category.name : 'Uncategorized',
        supplier: p.supplier ? (p.supplier.company || p.supplier.name) : 'N/A',
        currentStock: p.currentStock,
        minStockLevel: p.minStockLevel,
        unit: p.unit,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        totalCostValuation: Math.round(costVal * 100) / 100,
        totalRetailValuation: Math.round(retailVal * 100) / 100,
        status,
      };
    });

    res.status(200).json({
      success: true,
      summary: {
        totalProducts: products.length,
        totalQuantity,
        totalCostValuation: Math.round(totalCostValuation * 100) / 100,
        totalRetailValuation: Math.round(totalRetailValuation * 100) / 100,
        projectedMargin: Math.round((totalRetailValuation - totalCostValuation) * 100) / 100,
        lowStockCount,
        outOfStockCount,
      },
      records: rows,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Profit & Loss Report
// @route   GET /api/reports/profit
// @access  Private
export const getProfitReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    const dateFilter = buildDateFilter(startDate, endDate);
    if (dateFilter) {
      query.createdAt = dateFilter;
    }

    const sales = await Sale.find(query).sort({ createdAt: -1 });

    let totalRevenue = 0;
    let totalCostOfGoodsSold = 0;
    let totalGrossProfit = 0;

    const productProfitMap = {};

    sales.forEach((s) => {
      totalRevenue += s.totalAmount || 0;
      totalGrossProfit += s.totalProfit || 0;

      s.items.forEach((item) => {
        const cogs = (item.costPrice || 0) * item.quantity;
        totalCostOfGoodsSold += cogs;

        const key = item.sku;
        if (!productProfitMap[key]) {
          productProfitMap[key] = {
            productName: item.productName,
            sku: item.sku,
            quantitySold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          };
        }

        productProfitMap[key].quantitySold += item.quantity;
        productProfitMap[key].revenue += item.subtotal;
        productProfitMap[key].cost += cogs;
        productProfitMap[key].profit += item.subtotal - cogs;
      });
    });

    const profitMarginPercent = totalRevenue > 0
      ? Math.round((totalGrossProfit / totalRevenue) * 10000) / 100
      : 0;

    const breakdown = Object.values(productProfitMap).map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * 100) / 100,
      cost: Math.round(item.cost * 100) / 100,
      profit: Math.round(item.profit * 100) / 100,
      marginPercent: item.revenue > 0 ? Math.round((item.profit / item.revenue) * 10000) / 100 : 0,
    })).sort((a, b) => b.profit - a.profit);

    res.status(200).json({
      success: true,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCostOfGoodsSold: Math.round(totalCostOfGoodsSold * 100) / 100,
        totalGrossProfit: Math.round(totalGrossProfit * 100) / 100,
        profitMarginPercent,
        totalTransactions: sales.length,
      },
      records: breakdown,
    });
  } catch (err) {
    next(err);
  }
};
