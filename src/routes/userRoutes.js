import { Router } from 'express';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} from '../controllers/userController.js';
import { getUserProfile, createUserProfile, updateUserProfile } from '../controllers/profileController.js';
import { protect, requireAdmin } from '../middlewares/auth.js';

const router = Router();

// Todas las rutas del ABM requieren un token válido
router.use(protect);

// El ABM de usuarios es exclusivo de administradores (se valida en production, dev y test)
router.use(requireAdmin);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// Perfil de otro usuario. Estas cuelgan del mismo router, así que heredan el
// protect + requireAdmin de arriba. El path tiene dos segmentos, así que no
// chocan con /:id.
router.get('/:id/profile', getUserProfile);
router.post('/:id/profile', createUserProfile);
router.put('/:id/profile', updateUserProfile);

export default router;