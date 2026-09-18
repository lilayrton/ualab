import { Router } from 'express';
import {
    getPublicProducts,
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    searchAdminProducts
} from '../controllers/productController.js';
import { protect, requireAdmin } from '../middlewares/auth.js';

const router = Router();

// Sin token
router.get('/public', getPublicProducts);
router.get('/search', searchProducts);

// Con token
router.use(protect, requireAdmin);
router.get('/search/all', searchAdminProducts);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;