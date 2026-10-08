import express from 'express';
import {
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  getProfitReport,
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);
// Admin and Inventory Manager can view reports
router.use(authorize('Admin', 'Inventory Manager'));

router.get('/sales', getSalesReport);
router.get('/purchases', getPurchaseReport);
router.get('/inventory', getInventoryReport);
router.get('/profit', getProfitReport);

export default router;
