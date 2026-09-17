import { Router } from 'express';
import {
    getPublicCategories,
    getCategories,
    getCategoryTree,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController.js';
import { protect, requireAdmin } from '../middlewares/auth.js';

const router = Router();

// Sin token
router.get('/public', getPublicCategories);

// Con token
router.use(protect, requireAdmin);
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/:id', getCategory);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;