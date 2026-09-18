import { Router } from 'express';
import { getStoreInfo, updateStoreInfo, uploadLogo } from '../controllers/storeInfoController.js';
import { protect, requireAdmin } from '../middlewares/auth.js';
import { uploadSingle } from '../middlewares/upload.js';

const router = Router();

// Sin token: lo consume el footer del frontend
router.get('/', getStoreInfo);

// Con token: solo administradores
router.put('/', protect, requireAdmin, updateStoreInfo);
router.post('/logo', protect, requireAdmin, uploadSingle('logo'), uploadLogo);

export default router;
