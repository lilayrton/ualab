import { getProfileRepository } from '../repositories/ProfileRepository.js';
import { getUserRepository } from '../repositories/UserRepository.js';
import { parseBoolean, isValidId } from '../utils/validators.js';

// Normaliza isCompany: acepta booleano o string ("true"/"false"/"1"/"0").
// Sin esto, un body form-urlencoded manda "false" (string) que es truthy en JS
// y el perfil se validaba como empresa. Si no viene, se asume persona.
function resolveIsCompany(raw) {
    if (raw === undefined || raw === null || raw === '') {
        return { value: false };
    }

    return parseBoolean(raw, 'El campo isCompany');
}

// Normaliza los tipos del body y arma el payload de perfil.
// NO valida los campos obligatorios: eso corre aparte con checkRequiredFields,
// para que el POST pueda chequear el 409 antes de responder 400.
function normalizeProfilePayload(body) {
    const { firstName, lastName, phone, dni, cuit, companyName } = body;

    const companyResult = resolveIsCompany(body.isCompany);
    if (companyResult.error) {
        return { error: companyResult.error };
    }

    return { data: { firstName, lastName, phone, isCompany: companyResult.value, dni, cuit, companyName } };
}

// Normaliza + valida. Es el camino único de todos los PUT (el propio y el de admin),
// así las dos rutas no pueden empezar a aceptar cosas distintas.
function prepareProfileUpdate(body) {
    const { data, error } = normalizeProfilePayload(body);
    if (error) {
        return { error };
    }

    const validationError = checkRequiredFields(data);
    if (validationError) {
        return { error: validationError };
    }

    return { data };
}

// GET /api/profile - se obtiene el perfil autenticado
export async function getProfile(req, res) {
    const profile = await getProfileRepository().getByUserId(req.user.id);

    if (!profile) {
        return res.status(404).json({ message: 'Perfil no cargado' });
    }

    res.json(profile);
}

// Crea el perfil de un usuario. Es el camino único de los POST (el propio y el
// de admin), incluido el orden de chequeos, así no pueden divergir. El id llega
// ya resuelto por el llamador (cookie o :id de la ruta admin).
async function createProfileForUser(userId, body) {
    const { data, error } = normalizeProfilePayload(body);
    if (error) {
        return { error, status: 400 };
    }

    const profileRepo = getProfileRepository();

    const exists = await profileRepo.getByUserId(userId);
    if (exists) {
        return { error: 'Ya existe un perfil para este usuario', status: 409 };
    }

    const validationError = checkRequiredFields(data);
    if (validationError) {
        return { error: validationError, status: 400 };
    }

    return { profile: await profileRepo.create(userId, data) };
}

// POST /api/profile - se crea el perfil
export async function createProfile(req, res) {
    const { profile, error, status } = await createProfileForUser(req.user.id, req.body);

    if (error) {
        return res.status(status).json({ message: error });
    }

    res.status(201).json(profile);
}

// PUT /api/profile - actualizar perfil
export async function updateProfile(req, res) {
    const { data, error } = prepareProfileUpdate(req.body);
    if (error) {
        return res.status(400).json({ message: error });
    }

    const profile = await getProfileRepository().updateByUserId(req.user.id, data);

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

// Resuelve el usuario destino de las rutas de admin. Devuelve null con 404 ya
// emitido si el id no es válido o si el usuario no existe.
async function resolveTargetUser(req, res) {
    if (!isValidId(req.params.id)) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return null;
    }

    const user = await getUserRepository().getById(req.params.id);

    if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return null;
    }

    return user;
}

// GET /api/users/:id/profile - perfil de cualquier usuario (solo admin).
// A diferencia de /api/profile, acá el usuario viene del path y no de la sesión.
export async function getUserProfile(req, res) {
    const user = await resolveTargetUser(req, res);
    if (!user) {
        return;
    }

    const profile = await getProfileRepository().getByUserId(user.id);

    if (!profile) {
        return res.status(404).json({ message: 'Perfil no cargado' });
    }

    res.json(profile);
}

// PUT /api/users/:id/profile - un admin actualiza el perfil de otro usuario.
// No crea: si el usuario todavía no tiene perfil, responde 404. Para crearlo
// desde el panel está POST /api/users/:id/profile.
// Comparte prepareProfileUpdate con el PUT propio, así que valida igual.
export async function updateUserProfile(req, res) {
    const user = await resolveTargetUser(req, res);
    if (!user) {
        return;
    }

    const { data, error } = prepareProfileUpdate(req.body);
    if (error) {
        return res.status(400).json({ message: error });
    }

    const profile = await getProfileRepository().updateByUserId(user.id, data);

    if (!profile) {
        return res.status(404).json({ message: 'El perfil no existe' });
    }

    res.json(profile);
}

// POST /api/users/:id/profile - un admin crea el perfil de otro usuario.
// Es el caso de uso típico del panel: el cliente se registra, no carga su perfil,
// y el admin se lo completa a mano.
// Comparte createProfileForUser con el POST propio, así que valida exactamente
// lo mismo y devuelve el mismo 409 si el perfil ya existía.
export async function createUserProfile(req, res) {
    const user = await resolveTargetUser(req, res);
    if (!user) {
        return;
    }

    const { profile, error, status } = await createProfileForUser(user.id, req.body);

    if (error) {
        return res.status(status).json({ message: error });
    }

    res.status(201).json(profile);
}