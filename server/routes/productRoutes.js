import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProducts)
  .post(authorize('Admin', 'Inventory Manager'), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(authorize('Admin', 'Inventory Manager'), updateProduct)
  .delete(authorize('Admin', 'Inventory Manager'), deleteProduct);

export default router;
