import Supplier from '../models/Supplier.js';
import Purchase from '../models/Purchase.js';
import Product from '../models/Product.js';

// @desc    Get all suppliers with summary statistics
// @route   GET /api/suppliers
// @access  Private
export const getSuppliers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const suppliers = await Supplier.find(query).sort({ createdAt: -1 }).lean();

    // Attach purchase counts and products supplied
    const enriched = await Promise.all(
      suppliers.map(async (sup) => {
        const purchaseCount = await Purchase.countDocuments({ supplier: sup._id });
        const productCount = await Product.countDocuments({ supplier: sup._id });
        const purchases = await Purchase.find({ supplier: sup._id }).select('totalAmount');
        const totalPurchasedAmount = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

        return {
          ...sup,
          purchaseCount,
          productCount,
          totalPurchasedAmount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enriched.length,
      suppliers: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single supplier details with purchase history
// @route   GET /api/suppliers/:id
// @access  Private
export const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const purchases = await Purchase.find({ supplier: supplier._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const products = await Product.find({ supplier: supplier._id }).select('name sku currentStock sellingPrice');

    res.status(200).json({
      success: true,
      supplier,
      purchases,
      products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private (Admin, Inventory Manager)
export const createSupplier = async (req, res, next) => {
  try {
    const { name, company, email, phone, address, status } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Supplier contact name and phone number are required',
      });
    }

    const supplier = await Supplier.create({
      name: name.trim(),
      company: company ? company.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      phone: phone.trim(),
      address: address ? address.trim() : '',
      status: status || 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      supplier: {
        ...supplier.toObject(),
        purchaseCount: 0,
        productCount: 0,
        totalPurchasedAmount: 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Admin, Inventory Manager)
export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const { name, company, email, phone, address, status } = req.body;

    if (name) supplier.name = name.trim();
    if (company !== undefined) supplier.company = company.trim();
    if (email !== undefined) supplier.email = email.trim().toLowerCase();
    if (phone) supplier.phone = phone.trim();
    if (address !== undefined) supplier.address = address.trim();
    if (status) supplier.status = status;

    await supplier.save();

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      supplier,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin, Inventory Manager)
export const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Check if supplier has purchases
    const purchaseCount = await Purchase.countDocuments({ supplier: supplier._id });
    if (purchaseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier. ${purchaseCount} purchase order(s) are linked to this supplier.`,
      });
    }

    await Supplier.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
