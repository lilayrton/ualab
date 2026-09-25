import { getProfileRepository } from '../repositories/ProfileRepository.js';
import { parseBoolean } from '../utils/validators.js';

// Normaliza isCompany: acepta booleano o string ("true"/"false"/"1"/"0").
// Sin esto, un body form-urlencoded manda "false" (string) que es truthy en JS
// y el perfil se validaba como empresa. Si no viene, se assume persona.
function resolveIsCompany(raw) {
    if (raw === undefined || raw === null || raw === '') {
        return { value: false };
    }

    return parseBoolean(raw, 'El campo isCompany');
}

// GET /api/profile - se obtiene el perfil autenticado
export async function getProfile(req, res) {
    const profile = await getProfileRepository().getByUserId(req.user.id);

    if (!profile) {
        return res.status(404).json({ message: 'Perfil no cargado' });
    }

    res.json(profile);
}
// POST /api/profile - se crea el perfil
export async function createProfile(req, res) {
    const { firstName, lastName, phone, dni, cuit, companyName } = req.body;

    const companyResult = resolveIsCompany(req.body.isCompany);
    if (companyResult.error) {
        return res.status(400).json({ message: companyResult.error });
    }
    const isCompany = companyResult.value;

    const profileRepo = getProfileRepository();

    const exists = await profileRepo.getByUserId(req.user.id);
    if (exists) {
        return res.status(409).json({ message: 'Ya existe un perfil para este usuario' });
    }

    const validationError = checkRequiredFields({ isCompany, dni, cuit, companyName });
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    const profile = await profileRepo.create(
        req.user.id,
        { firstName, lastName, phone, isCompany, dni, cuit, companyName }
    );

    res.status(201).json(profile);
}

// PUT /api/profile - actualizar perfil
export async function updateProfile(req, res) {
    const { firstName, lastName, phone, dni, cuit, companyName } = req.body;

    const companyResult = resolveIsCompany(req.body.isCompany);
    if (companyResult.error) {
        return res.status(400).json({ message: companyResult.error });
    }
    const isCompany = companyResult.value;

    const validationError = checkRequiredFields({ isCompany, dni, cuit, companyName });
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