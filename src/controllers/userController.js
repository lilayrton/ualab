import { getUserRepository } from '../repositories/UserRepository.js';
import { isValidId } from '../utils/validators.js';

// Normaliza el email para guardar de forma consistente entre motores
function normalizeEmail(rawEmail) {
    return String(rawEmail || '').trim().toLowerCase();
}

// GET /api/users - listar
export async function getAllUsers(req, res) {
    const users = await getUserRepository().getAll();

    res.json(users);
}

// GET /api/users/:id - obtener
export async function getUserById(req, res) {
    if (!isValidId(req.params.id)) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = await getUserRepository().getById(req.params.id);

    if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
}

// POST /api/users - crear
export async function createUser(req, res) {
    const { password, role } = req.body;
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

    if (role !== undefined && role !== 'admin' && role !== 'user') {
        return res.status(400).json({ message: 'El rol debe ser "admin" o "user"' });
    }

    const userRepo = getUserRepository();
    if (await userRepo.emailExists(email)) {
        return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const user = await userRepo.create({ email, password, role: role || 'user' });

    res.status(201).json(user);
}

// PUT /api/users/:id - actualizar
// El ABM permite cambiar email, rol y contraseña (la contraseña la hashea el hook del modelo)
export async function updateUser(req, res) {
    if (!isValidId(req.params.id)) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const updates = {};

    if (req.body.email !== undefined) {
        const email = normalizeEmail(req.body.email);

        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ message: 'El email no es válido' });
        }

        updates.email = email;
    }

    if (req.body.role !== undefined) {
        if (req.body.role !== 'admin' && req.body.role !== 'user') {
            return res.status(400).json({ message: 'El rol debe ser "admin" o "user"' });
        }

        updates.role = req.body.role;
    }

    if (req.body.password !== undefined) {
        if (typeof req.body.password !== 'string' || req.body.password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }

        updates.password = req.body.password;
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    // Guard: un admin no puede quitarse su propio rol (evita quedarse sin administradores)
    if (updates.role && updates.role !== 'admin' && String(req.params.id) === String(req.user.id)) {
        return res.status(400).json({ message: 'No podés quitarte el rol de administrador' });
    }

    const user = await getUserRepository().update(req.params.id, updates);
    if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
}

// DELETE /api/users/:id - eliminar
export async function deleteUser(req, res) {
    if (!isValidId(req.params.id)) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = await getUserRepository().remove(req.params.id);

    if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado correctamente' });
}