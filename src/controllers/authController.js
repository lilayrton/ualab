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

    return jwt.sign({ id }, secret, { expiresIn: '1h' });
}

function getUserId(user) {
    return user.id ?? user._id;
}

// POST /api/auth/register
export async function register(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
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
    
    res.cookie('token', token, {
        httpOnly: true, // Cookie no legible por JS en el navegador (anti XSS)
        sameSite: 'lax', // Protege de CSRF
        maxAge: 24 * 60 * 60 * 1000 // 1 día, como el token
    }).status(201).json({
        user: { id: id, email: user.email }
    });
}

// POST /api/auth/login
export async function login(req, res) {
    const { email, password } = req.body;

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

    res.cookie('token', token, {
        httpOnly: true, // Cookie no legible por JS en el navegador (anti XSS)
        sameSite: 'lax', // Protege de CSRF
        maxAge: 24 * 60 * 60 * 1000 // 1 día, como el token
    }).json({
        user: { id: id, email: user.email }
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
    const { email } = req.body;

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

    const userRepo = getUserRepository();

    const user = await userRepo.getById(payload.id);
    if (!user) {
        return res.status(400).json({ message: 'El enlace es inválido o expiró' });
    }

    await userRepo.updatePassword(payload.id, newPassword);

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
}