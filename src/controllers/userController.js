import User from '../models/User.js';

// GET /api/users - listar
export async function getAllUsers(req, res) {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// GET /api/users/:id - obtener
export async function getUserById(req, res) {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// POST /api/users - crear
export async function createUser(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        const user = await User.create({ email, password });
        res.status(201).json(user);
    } catch (error) {
        // El error 11000 es Mongoose indicando que el email ya existe
        if (error.code === 11000) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        res.status(500).json({ message: error.message });
    }
}

// PUT /api/users/:id - actualizar
export async function updateUser(req, res) {
    try {
        const { email, password } = req.body;

        // No se actualiza la contraseña desde el ABM. Se usa para esto findByIdAndUpdate (no dispara hook pre('save)).
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { email },
            { new: true, runValidators: true } // Con new devolvemos el documento actualizado
        );

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// DELETE /api/users/:id - eliminar
export async function deleteUser(req, res) {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}