import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generar token JWT firmado con el id del usuario
function signToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

// POST /api/auth/register
export async function register(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        // Existencia de email
        const existing = await User.findOne({ email });
        if (existing) { 
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        // Se crea el usuario. El hook pre('save') hashea la contraseña
        const user = await User.create({ email, password });

        // Devolvemos el usuario y el token
        const token = signToken(user._id);
        
        res.cookie('token', token, {
            httpOnly: true, // Cookie no legible por JS en el navegador (anti XSS)
            sameSite: 'lax', // Protege de CSRF
            maxAge: 24 * 60 * 60 * 1000 // 1 día, como el token
        }).status(201).json({
            user: { id: user._id, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// POST /api/auth/login
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
        }

        // Obtenemos el usuario
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Comparamos la contraseña con el hash guardado en DB
        const valid = await user.comparePassword(password);
        if (!valid) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = signToken(user._id);

        res.cookie('token', token, {
            httpOnly: true, // Cookie no legible por JS en el navegador (anti XSS)
            sameSite: 'lax', // Protege de CSRF
            maxAge: 24 * 60 * 60 * 1000 // 1 día, como el token
        }).json({
            user: { id: user._id, email: user.email }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// POST /api/auth/logout
// Con los tokens JWT no hay sesión en el servidor, por lo que el logout sería que el usuario descarte el token.
export async function logout(req, res) {
    res.clearCookie('token').json({ message: 'Sesión cerrada correctamente' });
}