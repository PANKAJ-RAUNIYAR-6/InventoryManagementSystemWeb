import Product from '../models/Product.js';
import StockHistory from '../models/StockHistory.js';
import Notification from '../models/Notification.js';

// @desc    Get inventory summary and status
// @route   GET /api/inventory
// @access  Private
export const getInventorySummary = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('supplier', 'name company')
      .sort({ currentStock: 1 });

    let totalItems = 0;
    let totalStockValue = 0;
    let totalRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const inventoryList = products.map((prod) => {
      const stock = prod.currentStock;
      const minStock = prod.minStockLevel;
      totalItems += stock;
      totalStockValue += stock * prod.purchasePrice;
      totalRetailValue += stock * prod.sellingPrice;

      let status = 'In Stock';
      if (stock === 0) {
        status = 'Out of Stock';
        outOfStockCount++;
      } else if (stock <= minStock) {
        status = 'Low Stock';
        lowStockCount++;
      }

      return {
        _id: prod._id,
        name: prod.name,
        sku: prod.sku,
        category: prod.category ? prod.category.name : 'Uncategorized',
        supplier: prod.supplier ? (prod.supplier.company || prod.supplier.name) : 'N/A',
        currentStock: stock,
        minStockLevel: minStock,
        unit: prod.unit,
        purchasePrice: prod.purchasePrice,
        sellingPrice: prod.sellingPrice,
        stockValue: Math.round(stock * prod.purchasePrice * 100) / 100,
        retailValue: Math.round(stock * prod.sellingPrice * 100) / 100,
        status,
      };
    });

    res.status(200).json({
      success: true,
      summary: {
        totalProducts: products.length,
        totalItems,
        totalStockValue: Math.round(totalStockValue * 100) / 100,
        totalRetailValue: Math.round(totalRetailValue * 100) / 100,
        potentialProfit: Math.round((totalRetailValue - totalStockValue) * 100) / 100,
        lowStockCount,
        outOfStockCount,
        inStockCount: products.length - lowStockCount - outOfStockCount,
      },
      inventory: inventoryList,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Stock History audit log with filters
// @route   GET /api/inventory/history
// @access  Private
export const getStockHistory = async (req, res, next) => {
  try {
    const { product, type, startDate, endDate, page = 1, limit = 50 } = req.query;
    let query = {};

    if (product) {
      query.product = product;
    }

    if (type && ['PURCHASE', 'SALE', 'ADJUSTMENT'].includes(type)) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await StockHistory.countDocuments(query);

    const history = await StockHistory.find(query)
      .populate('product', 'name sku unit purchasePrice sellingPrice')
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: history.length,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      history,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Adjust inventory manually (Audit/Correction/Damage)
// @route   POST /api/inventory/adjust
// @access  Private (Admin, Inventory Manager)
export const adjustStock = async (req, res, next) => {
  try {
    const { productId, newQuantity, reason, notes } = req.body;

    if (!productId || newQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and new quantity are required',
      });
    }

    const targetQty = Number(newQuantity);
    if (isNaN(targetQty) || targetQty < 0) {
      return res.status(400).json({
        success: false,
        message: 'New quantity must be a non-negative number',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = product.currentStock;
    const diff = targetQty - previousStock;

    if (diff === 0) {
      return res.status(400).json({
        success: false,
        message: 'New quantity is identical to current stock. No change needed.',
      });
    }

    product.currentStock = targetQty;
    await product.save();

    const historyRecord = await StockHistory.create({
      product: product._id,
      type: 'ADJUSTMENT',
      quantity: Math.abs(diff),
      previousStock,
      newStock: targetQty,
      reference: reason || 'MANUAL_ADJUSTMENT',
      user: req.user ? req.user._id : null,
      notes: notes || `Stock manually adjusted from ${previousStock} to ${targetQty}`,
    });

    // Check low stock
    if (targetQty <= product.minStockLevel) {
      await Notification.create({
        title: `Low Stock Alert: ${product.name}`,
        message: `Current stock has been adjusted to ${targetQty} ${product.unit}, which is at or below minimum threshold (${product.minStockLevel}).`,
        type: 'LOW_STOCK',
        product: product._id,
      });
    }

    res.status(200).json({
      success: true,
      message: `Stock successfully adjusted for ${product.name}`,
      product,
      history: historyRecord,
    });
  } catch (err) {
    next(err);
  }
};
