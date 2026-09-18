import { getUserRepository } from '../repositories/UserRepository.js';

// GET /api/users - listar
export async function getAllUsers(req, res) {
    const users = await getUserRepository().getAll();
    
    res.json(users);
}

// GET /api/users/:id - obtener
export async function getUserById(req, res) {
    const user = await getUserRepository().getById(req.params.id);

    if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
}

// POST /api/users - crear
export async function createUser(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const userRepo = getUserRepository();
    if (await userRepo.emailExists(email)) {
        return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const user = await userRepo.create({ email, password });

    res.status(201).json(user);
}

// PUT /api/users/:id - actualizar
// El ABM no actualiza contraseñas: solo se envía el email, por eso no interviene el hook de hasheo
export async function updateUser(req, res) {
    const { email } = req.body;

    const user = await getUserRepository().update(req.params.id, { email });
    if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
}

// DELETE /api/users/:id - eliminar
export async function deleteUser(req, res) {
    const user = await getUserRepository().remove(req.params.id);

    if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado correctamente' });
}