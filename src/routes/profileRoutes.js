import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { getProfile, createProfile, updateProfile } from '../controllers/profileController.js';

const router = Router();

router.use(protect);

router.get('/', getProfile);
router.post('/', createProfile);
router.put('/', updateProfile);

export default router;