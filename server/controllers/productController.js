import Product from '../models/Product.js';
import StockHistory from '../models/StockHistory.js';
import Notification from '../models/Notification.js';
import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';

// @desc    Get all products with filtering, search & pagination
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      supplier,
      stockStatus,
      status,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 100, // flexible default
    } = req.query;

    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (supplier) {
      filter.supplier = supplier;
    }

    if (status) {
      filter.status = status;
    }

    if (stockStatus === 'out_of_stock') {
      filter.currentStock = { $lte: 0 };
    } else if (stockStatus === 'low_stock') {
      filter.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
      filter.currentStock = { $gt: 0 };
    } else if (stockStatus === 'in_stock') {
      filter.$expr = { $gt: ['$currentStock', '$minStockLevel'] };
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sortBy]: sortOrder };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('supplier', 'name company phone')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('supplier', 'name company email phone');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Recent stock history for this product
    const stockHistory = await StockHistory.find({ product: product._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      product,
      stockHistory,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin, Inventory Manager)
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category,
      supplier,
      description,
      purchasePrice,
      sellingPrice,
      currentStock = 0,
      minStockLevel = 5,
      unit = 'pcs',
      status = 'active',
    } = req.body;

    if (!name || !sku || !category || purchasePrice === undefined || sellingPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, SKU, category, purchase price, and selling price are required',
      });
    }

    // Check duplicate SKU
    const existingSku = await Product.findOne({ sku: sku.trim().toUpperCase() });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: `Product SKU '${sku.toUpperCase()}' already exists. Please choose a unique SKU.`,
      });
    }

    const stockNum = Math.max(0, Number(currentStock) || 0);

    const product = await Product.create({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category,
      supplier: supplier || null,
      description: description || '',
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      currentStock: stockNum,
      minStockLevel: Math.max(0, Number(minStockLevel) || 5),
      unit: unit || 'pcs',
      status,
    });

    // If initial stock was provided > 0, log in StockHistory
    if (stockNum > 0) {
      await StockHistory.create({
        product: product._id,
        type: 'ADJUSTMENT',
        quantity: stockNum,
        previousStock: 0,
        newStock: stockNum,
        reference: 'INITIAL_STOCK',
        user: req.user ? req.user._id : null,
        notes: 'Initial inventory entry upon product creation',
      });
    }

    // Check low stock trigger
    if (stockNum <= product.minStockLevel) {
      await Notification.create({
        title: `Low Stock Alert: ${product.name}`,
        message: `Current stock (${stockNum} ${product.unit}) is at or below minimum threshold (${product.minStockLevel}).`,
        type: 'LOW_STOCK',
        product: product._id,
      });
    }

    const populated = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('supplier', 'name company');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin, Inventory Manager)
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      name,
      sku,
      category,
      supplier,
      description,
      purchasePrice,
      sellingPrice,
      minStockLevel,
      unit,
      status,
    } = req.body;

    if (sku && sku.trim().toUpperCase() !== product.sku) {
      const existingSku = await Product.findOne({
        sku: sku.trim().toUpperCase(),
        _id: { $ne: product._id },
      });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: `SKU '${sku.toUpperCase()}' is already taken by another product`,
        });
      }
      product.sku = sku.trim().toUpperCase();
    }

    if (name) product.name = name.trim();
    if (category) product.category = category;
    if (supplier !== undefined) product.supplier = supplier || null;
    if (description !== undefined) product.description = description;
    if (purchasePrice !== undefined) product.purchasePrice = Number(purchasePrice);
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (minStockLevel !== undefined) product.minStockLevel = Number(minStockLevel);
    if (unit) product.unit = unit;
    if (status) product.status = status;

    await product.save();

    // Check low stock status
    if (product.currentStock <= product.minStockLevel) {
      const existingNotif = await Notification.findOne({
        product: product._id,
        type: 'LOW_STOCK',
        isRead: false,
      });
      if (!existingNotif) {
        await Notification.create({
          title: `Low Stock Alert: ${product.name}`,
          message: `Current stock (${product.currentStock} ${product.unit}) is at or below minimum threshold (${product.minStockLevel}).`,
          type: 'LOW_STOCK',
          product: product._id,
        });
      }
    }

    const updated = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('supplier', 'name company');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin, Inventory Manager)
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Safety check: if product is part of sales or purchases
    const hasSales = await Sale.findOne({ 'items.product': product._id });
    const hasPurchases = await Purchase.findOne({ 'items.product': product._id });

    if (hasSales || hasPurchases) {
      // Soft-delete: mark inactive instead of breaking integrity
      product.status = 'inactive';
      await product.save();
      return res.status(200).json({
        success: true,
        message: 'Product has active transaction records and was marked as Inactive instead of permanent deletion.',
      });
    }

    await Product.findByIdAndDelete(req.params.id);
    await StockHistory.deleteMany({ product: product._id });
    await Notification.deleteMany({ product: product._id });

    res.status(200).json({
      success: true,
      message: 'Product deleted permanently',
    });
  } catch (err) {
    next(err);
  }
};
