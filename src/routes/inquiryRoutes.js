import { Router } from 'express';
import {
    createInquiry,
    getInquiries,
    getInquiryStats,
    getInquiry,
    updateInquiryStatus,
    deleteInquiry
} from '../controllers/inquiryController.js';
import { protect, requireAdmin } from '../middlewares/auth.js';
import { rateLimit } from '../middlewares/rateLimit.js';

const router = Router();

// Sin token: envío del formulario de contacto / ficha de producto
router.post('/', rateLimit(), createInquiry);

// Con token: bandeja de administración
router.use(protect, requireAdmin);
router.get('/', getInquiries);
router.get('/stats', getInquiryStats);
router.get('/:id', getInquiry);
router.patch('/:id/status', updateInquiryStatus);
router.delete('/:id', deleteInquiry);

export default router;
