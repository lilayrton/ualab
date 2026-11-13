import { Router } from 'express';
import {
    getPublicProducts,
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    searchAdminProducts,
    getFeaturedProducts,
    getNewProducts
} from '../controllers/productController.js';
import { protect, requireAdmin } from '../middlewares/auth.js';

const router = Router();

// Sin token
router.get('/public', getPublicProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new', getNewProducts);
router.get('/search', searchProducts);
router.get('/:id', getProduct);

// Con token
router.use(protect, requireAdmin);
router.get('/search/all', searchAdminProducts);
router.get('/', getProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;