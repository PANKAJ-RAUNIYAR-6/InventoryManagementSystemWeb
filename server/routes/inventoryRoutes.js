import express from 'express';
import {
  getInventorySummary,
  getStockHistory,
  adjustStock,
} from '../controllers/inventoryController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

router.get('/', getInventorySummary);
router.get('/history', getStockHistory);
router.post('/adjust', authorize('Admin', 'Inventory Manager'), adjustStock);

export default router;
