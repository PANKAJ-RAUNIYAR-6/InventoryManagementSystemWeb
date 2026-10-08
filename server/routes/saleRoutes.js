import express from 'express';
import {
  getSales,
  getSaleById,
  createSale,
} from '../controllers/saleController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSales)
  .post(authorize('Admin', 'Inventory Manager', 'Staff'), createSale);

router.route('/:id')
  .get(getSaleById);

export default router;
