import { Router } from 'express';
import {
    register,
    login,
    logout,
    getMe,
    forgotPassword,
    resetPassword,
    changePassword
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import { rateLimit } from '../middlewares/rateLimit.js';

const router = Router();

// Límites específicos para auth (se pueden ajustar por variable de entorno)
// Bucket propio "auth": no comparte presupuesto con el formulario de consultas
const authLimiter = rateLimit({
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
    message: 'Demasiados intentos. Intentá nuevamente más tarde.',
    name: 'auth'
});

// Endpoints sensibles: el límite evita fuerza bruta sobre credenciales y tokens
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
// Protegido: el cambio de contraseña exige sesión y también limita intentos (anti fuerza bruta)
router.post('/change-password', protect, authLimiter, changePassword);

export default router;