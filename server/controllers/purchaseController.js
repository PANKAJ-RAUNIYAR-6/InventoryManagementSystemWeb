import Purchase from '../models/Purchase.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import StockHistory from '../models/StockHistory.js';
import Notification from '../models/Notification.js';

// @desc    Get all purchases with filter and search
// @route   GET /api/purchases
// @access  Private
export const getPurchases = async (req, res, next) => {
  try {
    const { search, supplier, startDate, endDate, page = 1, limit = 50 } = req.query;
    let query = {};

    if (supplier) {
      query.supplier = supplier;
    }

    if (search) {
      query.$or = [
        { purchaseNumber: { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } },
        { 'items.sku': { $regex: search, $options: 'i' } },
      ];
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
    const total = await Purchase.countDocuments(query);

    const purchases = await Purchase.find(query)
      .populate('supplier', 'name company email phone')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: purchases.length,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      purchases,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single purchase details
// @route   GET /api/purchases/:id
// @access  Private
export const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name company email phone address')
      .populate('createdBy', 'name email role')
      .populate('items.product', 'name sku unit');

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    res.status(200).json({
      success: true,
      purchase,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new purchase order
// @route   POST /api/purchases
// @access  Private (Admin, Inventory Manager)
export const createPurchase = async (req, res, next) => {
  try {
    const { supplier, items, notes } = req.body;

    if (!supplier) {
      return res.status(400).json({ success: false, message: 'Supplier is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product item must be included in the purchase order',
      });
    }

    const supplierDoc = await Supplier.findById(supplier);
    if (!supplierDoc) {
      return res.status(404).json({ success: false, message: 'Selected supplier not found' });
    }

    // Generate unique Purchase Order Number
    const count = await Purchase.countDocuments();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const purchaseNumber = `PO-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    let totalAmount = 0;
    const validatedItems = [];

    // Verify products, compute subtotals, and update stock
    for (const item of items) {
      const { product: productId, quantity, unitPrice } = item;

      if (!productId) {
        return res.status(400).json({ success: false, message: 'Product ID is missing from item' });
      }

      const q = Number(quantity);
      const p = Number(unitPrice);

      if (isNaN(q) || q <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Item quantity must be a positive number',
        });
      }

      if (isNaN(p) || p < 0) {
        return res.status(400).json({
          success: false,
          message: 'Item unit purchase price cannot be negative',
        });
      }

      const productDoc = await Product.findById(productId);
      if (!productDoc) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${productId} not found`,
        });
      }

      const subtotal = Math.round(q * p * 100) / 100;
      totalAmount += subtotal;

      validatedItems.push({
        product: productDoc._id,
        productName: productDoc.name,
        sku: productDoc.sku,
        quantity: q,
        unitPrice: p,
        subtotal,
      });

      // Update product stock atomically and update purchasePrice to latest
      const previousStock = productDoc.currentStock;
      const newStock = previousStock + q;

      productDoc.currentStock = newStock;
      productDoc.purchasePrice = p; // update latest purchase cost
      await productDoc.save();

      // Record in StockHistory
      await StockHistory.create({
        product: productDoc._id,
        type: 'PURCHASE',
        quantity: q,
        previousStock,
        newStock,
        reference: purchaseNumber,
        user: req.user ? req.user._id : null,
        notes: `Received purchase from ${supplierDoc.name || supplierDoc.company}`,
      });

      // If product was previously low stock and is now above minStockLevel, remove low stock notification
      if (newStock > productDoc.minStockLevel) {
        await Notification.deleteMany({
          product: productDoc._id,
          type: 'LOW_STOCK',
        });
      }
    }

    const purchase = await Purchase.create({
      purchaseNumber,
      supplier: supplierDoc._id,
      items: validatedItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      notes: notes || '',
      status: 'completed',
      createdBy: req.user ? req.user._id : null,
    });

    // Create system notification for purchase
    await Notification.create({
      title: `New Purchase Order ${purchaseNumber}`,
      message: `Received ${validatedItems.length} item(s) from ${supplierDoc.name || supplierDoc.company} totaling $${totalAmount.toFixed(2)}.`,
      type: 'PURCHASE',
    });

    const populated = await Purchase.findById(purchase._id)
      .populate('supplier', 'name company email phone')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Purchase created and inventory updated successfully',
      purchase: populated,
    });
  } catch (err) {
    next(err);
  }
};
