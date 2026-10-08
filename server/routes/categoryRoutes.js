import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCategories)
  .post(authorize('Admin', 'Inventory Manager'), createCategory);

router.route('/:id')
  .put(authorize('Admin', 'Inventory Manager'), updateCategory)
  .delete(authorize('Admin', 'Inventory Manager'), deleteCategory);

export default router;
