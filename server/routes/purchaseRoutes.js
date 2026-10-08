import express from 'express';
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
} from '../controllers/purchaseController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getPurchases)
  .post(authorize('Admin', 'Inventory Manager'), createPurchase);

router.route('/:id')
  .get(getPurchaseById);

export default router;
