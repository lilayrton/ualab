import jwt from 'jsonwebtoken';
import { getUserRepository } from '../repositories/UserRepository.js';

export function protect(req, res, next) {
    // El token viene en la cookie httpOnly, no en el header
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ message: 'No autorizado. Falta el token' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.id };
        
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
}

// Exige que el usuario autenticado tenga rol de administrador
// Se usa siempre después de `protect` (req.user.id ya existe)
export async function requireAdmin(req, res, next) {
    const user = await getUserRepository().getById(req.user.id);
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Se requiere rol de administrador' });
    }

    next();
}