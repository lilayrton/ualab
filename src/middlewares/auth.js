import jwt from 'jsonwebtoken';

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