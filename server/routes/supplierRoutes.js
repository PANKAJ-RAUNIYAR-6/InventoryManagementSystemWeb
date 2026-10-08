import express from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSuppliers)
  .post(authorize('Admin', 'Inventory Manager'), createSupplier);

router.route('/:id')
  .get(getSupplierById)
  .put(authorize('Admin', 'Inventory Manager'), updateSupplier)
  .delete(authorize('Admin', 'Inventory Manager'), deleteSupplier);

export default router;
