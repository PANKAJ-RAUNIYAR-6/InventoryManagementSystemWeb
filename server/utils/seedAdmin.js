import User from '../models/User.js';
import Category from '../models/Category.js';
import Supplier from '../models/Supplier.js';
import Product from '../models/Product.js';
import StockHistory from '../models/StockHistory.js';
import Notification from '../models/Notification.js';

export const seedInitialData = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'change_this_password';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    let admin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!admin) {
      console.log(`[SEED] Initializing Admin user (${adminEmail})...`);
      admin = await User.create({
        name: adminName,
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        role: 'Admin',
        phone: '+1 (555) 019-2834',
        status: 'active',
      });
      console.log('[SEED] Admin user created successfully from environment variables!');
    }

    // Check if initial categories and sample products exist
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('[SEED] Populating default business categories and suppliers...');
      const catElectronics = await Category.create({
        name: 'Electronics & Gadgets',
        description: 'Electronic devices, peripherals, and computer components',
      });
      const catOffice = await Category.create({
        name: 'Office Supplies',
        description: 'Stationery, paper products, and office desk accessories',
      });
      const catFurniture = await Category.create({
        name: 'Commercial Furniture',
        description: 'Ergonomic chairs, desks, and storage shelving',
      });

      const supTech = await Supplier.create({
        name: 'Apex Global Tech Ltd',
        company: 'Apex Technologies Inc.',
        email: 'orders@apextech.com',
        phone: '+1 (800) 555-0144',
        address: '100 Silicon Way, San Jose, CA',
      });

      const supOffice = await Supplier.create({
        name: 'Prime Office Distribution',
        company: 'Prime Global Logistics',
        email: 'sales@primeofficedist.com',
        phone: '+1 (800) 555-0198',
        address: '450 Industrial Parkway, Chicago, IL',
      });

      const sampleProducts = [
        {
          name: 'Logitech MX Master 3S Wireless Mouse',
          sku: 'LOG-MX3S-BLK',
          category: catElectronics._id,
          supplier: supTech._id,
          description: 'Ergonomic wireless mouse with quiet clicks and 8000 DPI sensor',
          purchasePrice: 65,
          sellingPrice: 99.99,
          currentStock: 34,
          minStockLevel: 8,
          unit: 'pcs',
        },
        {
          name: 'Dell UltraSharp 27" 4K Monitor',
          sku: 'DEL-U2723QE',
          category: catElectronics._id,
          supplier: supTech._id,
          description: 'Color-accurate IPS Black 4K display with USB-C 90W power delivery',
          purchasePrice: 380,
          sellingPrice: 579,
          currentStock: 12,
          minStockLevel: 5,
          unit: 'pcs',
        },
        {
          name: 'Steelcase Gesture Ergonomic Office Chair',
          sku: 'STC-GEST-01',
          category: catFurniture._id,
          supplier: supOffice._id,
          description: 'Premium adjustable ergonomic mesh chair with lumbar support',
          purchasePrice: 620,
          sellingPrice: 940,
          currentStock: 4, // Below min stock to showcase low stock alert!
          minStockLevel: 6,
          unit: 'pcs',
        },
        {
          name: 'Executive Recycled A4 Paper Box (5 Reams)',
          sku: 'PPR-A4-500R',
          category: catOffice._id,
          supplier: supOffice._id,
          description: '80 GSM bright white multi-purpose copy paper reams',
          purchasePrice: 18,
          sellingPrice: 32.5,
          currentStock: 80,
          minStockLevel: 15,
          unit: 'box',
        },
        {
          name: 'Anker PowerExpand 8-in-1 USB-C Hub',
          sku: 'ANK-HUB-8IN1',
          category: catElectronics._id,
          supplier: supTech._id,
          description: 'Dual 4K HDMI, Gigabit Ethernet, SD card reader & 100W PD',
          purchasePrice: 32,
          sellingPrice: 59.99,
          currentStock: 2, // Low stock
          minStockLevel: 10,
          unit: 'pcs',
        },
      ];

      for (const prodData of sampleProducts) {
        const prod = await Product.create(prodData);
        // Create initial stock history
        await StockHistory.create({
          product: prod._id,
          type: 'PURCHASE',
          quantity: prod.currentStock,
          previousStock: 0,
          newStock: prod.currentStock,
          reference: 'INITIAL-STOCK-SETUP',
          user: admin._id,
          notes: 'Initial warehouse stocking inventory',
        });

        // If low stock, create notification
        if (prod.currentStock <= prod.minStockLevel) {
          await Notification.create({
            title: `Low Stock Alert: ${prod.name}`,
            message: `Current stock (${prod.currentStock} ${prod.unit}) is at or below minimum threshold (${prod.minStockLevel}).`,
            type: 'LOW_STOCK',
            product: prod._id,
          });
        }
      }

      console.log('[SEED] Default inventory database initialized successfully!');
    }
  } catch (err) {
    console.error('[SEED] Error during data seeding:', err);
  }
};
