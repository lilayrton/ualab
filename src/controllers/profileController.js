import { getProfileRepository } from '../repositories/ProfileRepository.js';

// GET /api/profile - se obtiene el perfil autenticado
export async function getProfile(req, res) {
    try {
        const profile = await getProfileRepository().getByUserId(req.user.id);

        if (!profile) {
            return res.status(404).json({ message: 'Perfil no cargado' });
        }

        res.json(profile);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// POST /api/profile - se crea el perfil
export async function createProfile(req, res) {
    try {
        const { firstName, lastName, phone, isCompany, dni, cuit, companyName } = req.body;

        const profileRepo = getProfileRepository();

        const exists = await profileRepo.getByUserId(req.user.id);
        if (exists) {
            return res.status(409).json({ message: 'Ya existe un perfil para este usuario' });
        }

        const validationError = checkRequiredFields(req.body);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const profile = await profileRepo.create(
            req.user.id,
            { firstName, lastName, phone, isCompany, dni, cuit, companyName }
        );

        res.status(201).json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// PUT /api/profile - actualizar perfil
export async function updateProfile(req, res) {
    try {
        const { firstName, lastName, phone, isCompany, dni, cuit, companyName } = req.body;

        const validationError = checkRequiredFields(req.body);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const profileRepo = getProfileRepository();

        const profile = await profileRepo.updateByUserId(
            req.user.id,
            { firstName, lastName, phone, isCompany, dni, cuit, companyName }
        );

        if (!profile) {
            return res.status(404).json({ message: 'El perfil no existe' });
        }

        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Valida que el perfil esté completo según si es persona o empresa
function checkRequiredFields(body) {
    const { isCompany, dni, cuit, companyName } = body;

    if (isCompany) {
        if (!cuit || !companyName) {
            return 'El CUIT y la razón social son obligatorios';
        }
    } else {
        if (!dni) {
            return 'El DNI es obligatorio';
        }
    }

    return null;
}