import jwt from 'jsonwebtoken';
import { getUserRepository } from '../repositories/UserRepository.js';
import { getStoreInfoRepository } from '../repositories/StoreInfoRepository.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';

// Generar token JWT firmado con el id del usuario
function signToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

// Generación de token para recuperar contraseña
function signResetToken(id) {
    const secret = process.env.RESET_SECRET || process.env.JWT_SECRET;

    return jwt.sign({ id, purpose: 'reset' }, secret, { expiresIn: '1h' });
}

// Normaliza el email ingresado para comparar y guardar de forma consistente entre motores
function normalizeEmail(rawEmail) {
    return String(rawEmail || '').trim().toLowerCase();
}

function getUserId(user) {
    return user.id ?? user._id;
}

// Opciones de la cookie de sesión (idénticas en login y register)
function getCookieOptions() {
    // COOKIE_SAME_SITE=none habilita la cookie en producción con dominios distintos (requiere HTTPS).
    // Por defecto usamos lax: alcanza entre subdominios del mismo sitio y en dev localhost.
    const sameSite = process.env.COOKIE_SAME_SITE === 'none' ? 'none' : 'lax';

    return {
        httpOnly: true, // Cookie no legible por JS en el navegador (anti XSS)
        sameSite, // 'lax' protege de CSRF; 'none' solo si el frontend está en otro dominio
        secure: sameSite === 'none' || process.env.NODE_ENV === 'production', // 'none' exige HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 1 día, como el token
    };
}

// POST /api/auth/register
export async function register(req, res) {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ message: 'El email no es válido' });
    }

    if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const userRepo = getUserRepository();

    // Existencia de email
    const existing = await userRepo.emailExists(email);
    if (existing) {
        return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const userCount = await userRepo.count(); // El primer usuario registrado queda como administrador
    const role = userCount === 0 ? 'admin' : 'user';
    const user = await userRepo.create({ email, password, role }); // El hook del modelo hashea la contraseña

    const id = getUserId(user);
    const token = signToken(id);

    res.cookie('token', token, getCookieOptions()).status(201).json({
        user: { id: id, email: user.email, role: user.role }
    });
}

// POST /api/auth/login
export async function login(req, res) {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    const userRepo = getUserRepository();

    // Obtenemos el usuario
    const user = await userRepo.getByEmail(email);
    if (!user) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Comparamos la contraseña con el hash guardado en DB
    const valid = await user.comparePassword(password);
    if (!valid) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const id = getUserId(user);
    const token = signToken(id);

    res.cookie('token', token, getCookieOptions()).json({
        user: { id: id, email: user.email, role: user.role }
    });
}

// GET /api/auth/me
export async function getMe(req, res) {
    const userRepo = getUserRepository();
    const user = await userRepo.getById(req.user.id);
    if (!user) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const id = getUserId(user);
    res.json({
        user: { id: id, email: user.email, role: user.role }
    });
}

// POST /api/auth/logout
// Con los tokens JWT no hay sesión en el servidor, por lo que el logout sería que el usuario descarte el token.
export async function logout(req, res) {
    res.clearCookie('token').json({ message: 'Sesión cerrada correctamente' });
}

// POST /api/auth/forgot-password
// Siempre responde lo mismo para no revelar qué emails están registrados y evitar problemas de seguridad.
export async function forgotPassword(req, res) {
    const email = normalizeEmail(req.body.email);

    if (!email) {
        return res.status(400).json({ message: 'El email es obligatorio' });
    }

    const user = await getUserRepository().getByEmail(email);

    if (user) {
        const id = getUserId(user);
        const resetToken = signResetToken(id);
        const resetUrl = process.env.SITE_URL || 'http://localhost:3000';
        const resetLink = `${resetUrl}/reset-password?token=${resetToken}`;
        const storeName = (await getStoreInfoRepository().get()).name;

        await sendPasswordResetEmail(email, resetLink, storeName);
    }

    res.status(200).json({
        message: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña'
    });
}

// POST /api/auth/reset-password
export async function resetPassword(req, res) {
    const { token, newPassword } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'El token es obligatorio' });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const secret = process.env.RESET_SECRET || process.env.JWT_SECRET;

    let payload;
    try {
        payload = jwt.verify(token, secret);
    } catch (error) {
        return res.status(400).json({ message: 'El enlace es inválido o expiró' });
    }

    // Aceptamos únicamente tokens emitidos para reset de contraseña (no tokens de sesión)
    if (payload.purpose !== 'reset') {
        return res.status(400).json({ message: 'El enlace es inválido o expiró' });
    }

    const userRepo = getUserRepository();

    const user = await userRepo.getById(payload.id);
    if (!user) {
        return res.status(400).json({ message: 'El enlace es inválido o expiró' });
    }

    await userRepo.updatePassword(payload.id, newPassword);

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
}

// POST /api/auth/change-password
// Cambio de contraseña del usuario autenticado: se pide la actual para confirmar la identidad.
export async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'La contraseña actual y la nueva son obligatorias' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (newPassword === currentPassword) {
        return res.status(400).json({ message: 'La nueva contraseña debe ser distinta de la actual' });
    }

    const userRepo = getUserRepository();

    // Traemos el documento con la contraseña para compararla contra el hash de la actual
    const user = await userRepo.getByIdRaw(req.user.id);
    if (!user) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
        return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
    }

    await userRepo.updatePassword(req.user.id, newPassword);

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
}