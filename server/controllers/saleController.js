import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import StockHistory from '../models/StockHistory.js';
import Notification from '../models/Notification.js';

// @desc    Get all sales with filtering and search
// @route   GET /api/sales
// @access  Private
export const getSales = async (req, res, next) => {
  try {
    const { search, paymentMethod, startDate, endDate, page = 1, limit = 50 } = req.query;
    let query = {};

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
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
    const total = await Sale.countDocuments(query);

    const sales = await Sale.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: sales.length,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      sales,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single sale by ID
// @route   GET /api/sales/:id
// @access  Private
export const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('items.product', 'name sku unit');

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found' });
    }

    res.status(200).json({
      success: true,
      sale,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new sale & deduct inventory
// @route   POST /api/sales
// @access  Private (Admin, Inventory Manager, Staff)
export const createSale = async (req, res, next) => {
  try {
    const { customerName, customerPhone, items, paymentMethod = 'Cash', notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product item must be added to the sale invoice',
      });
    }

    // Step 1: Pre-validate all items and stock levels BEFORE performing any mutations
    const productsToUpdate = [];
    let totalAmount = 0;
    let totalProfit = 0;

    for (const item of items) {
      const { product: productId, quantity, unitPrice } = item;

      if (!productId) {
        return res.status(400).json({ success: false, message: 'Product ID is missing from item' });
      }

      const q = Number(quantity);
      if (isNaN(q) || q <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Sale item quantity must be greater than zero',
        });
      }

      const productDoc = await Product.findById(productId);
      if (!productDoc) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${productId} was not found`,
        });
      }

      if (productDoc.status === 'inactive') {
        return res.status(400).json({
          success: false,
          message: `Product '${productDoc.name}' is inactive and cannot be sold`,
        });
      }

      // Check available stock! Prevent selling more than available stock!
      if (productDoc.currentStock < q) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${productDoc.name}'. Requested: ${q}, Available: ${productDoc.currentStock}`,
        });
      }

      const sellingPrice = unitPrice !== undefined ? Number(unitPrice) : productDoc.sellingPrice;
      if (isNaN(sellingPrice) || sellingPrice < 0) {
        return res.status(400).json({
          success: false,
          message: `Selling price for '${productDoc.name}' cannot be negative`,
        });
      }

      const subtotal = Math.round(q * sellingPrice * 100) / 100;
      const profit = Math.round((sellingPrice - productDoc.purchasePrice) * q * 100) / 100;

      totalAmount += subtotal;
      totalProfit += profit;

      productsToUpdate.push({
        doc: productDoc,
        quantity: q,
        sellingPrice,
        subtotal,
        profit,
      });
    }

    // Step 2: Generate Invoice Number
    const count = await Sale.countDocuments();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceNumber = `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    // Step 3: Perform inventory deduction, stock history creation, and low-stock checks
    const saleItems = [];

    for (const itemData of productsToUpdate) {
      const { doc: productDoc, quantity: q, sellingPrice, subtotal } = itemData;

      const previousStock = productDoc.currentStock;
      const newStock = previousStock - q;

      productDoc.currentStock = newStock;
      await productDoc.save();

      saleItems.push({
        product: productDoc._id,
        productName: productDoc.name,
        sku: productDoc.sku,
        quantity: q,
        unitPrice: sellingPrice,
        costPrice: productDoc.purchasePrice,
        subtotal,
      });

      // Stock history record
      await StockHistory.create({
        product: productDoc._id,
        type: 'SALE',
        quantity: q,
        previousStock,
        newStock,
        reference: invoiceNumber,
        user: req.user ? req.user._id : null,
        notes: `Sale to ${customerName || 'Walk-in Customer'}`,
      });

      // Automatic Low Stock Detection
      if (newStock <= productDoc.minStockLevel) {
        // Create notification
        await Notification.create({
          title: `Low Stock Alert: ${productDoc.name}`,
          message: `Current stock (${newStock} ${productDoc.unit}) has dropped to or below minimum threshold (${productDoc.minStockLevel}).`,
          type: 'LOW_STOCK',
          product: productDoc._id,
        });
      }
    }

    // Step 4: Create Sale Record
    const sale = await Sale.create({
      invoiceNumber,
      customerName: customerName ? customerName.trim() : 'Walk-in Customer',
      customerPhone: customerPhone ? customerPhone.trim() : '',
      items: saleItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      paymentMethod,
      notes: notes || '',
      createdBy: req.user ? req.user._id : null,
    });

    // Notify of new sale
    await Notification.create({
      title: `Sale Completed ${invoiceNumber}`,
      message: `Invoice ${invoiceNumber} created for ${customerName || 'Walk-in Customer'}: $${totalAmount.toFixed(2)}.`,
      type: 'SALE',
    });

    const populated = await Sale.findById(sale._id)
      .populate('createdBy', 'name email')
      .populate('items.product', 'name sku unit');

    res.status(201).json({
      success: true,
      message: 'Sale recorded and inventory updated successfully',
      sale: populated,
    });
  } catch (err) {
    next(err);
  }
};
