import { Router } from 'express';
import {
    getPublicDiscounts,
    getDiscounts,
    getDiscount,
    createDiscount,
    updateDiscount,
    deleteDiscount
} from '../controllers/discountController.js';
import { protect, requireAdmin } from '../middlewares/auth.js';

const router = Router();

// Sin token
router.get('/public', getPublicDiscounts);

// Con token
router.use(protect, requireAdmin);
router.get('/', getDiscounts);
router.get('/:id', getDiscount);
router.post('/', createDiscount);
router.put('/:id', updateDiscount);
router.delete('/:id', deleteDiscount);

export default router;