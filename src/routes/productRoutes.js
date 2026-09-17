import { Router } from 'express';
import {
    getPublicProducts,
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';
import { protect, requireAdmin } from '../middlewares/auth.js';

const router = Router();

// Sin token
router.get('/public', getPublicProducts);

// Con token
router.use(protect, requireAdmin);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;