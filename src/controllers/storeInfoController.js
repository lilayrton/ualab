import fs from 'fs';
import path from 'path';
import { getStoreInfoRepository } from '../repositories/StoreInfoRepository.js';
import { UPLOAD_DIR } from '../middlewares/upload.js';

// Normaliza el body: se actualizan solo los campos institucionales presentes
function pickStoreInfoFields(body) {
    const data = {};

    if (body.name !== undefined) {
        if (typeof body.name !== 'string' || !body.name.trim()) {
            return { error: 'El nombre del comercio es obligatorio' };
        }

        data.name = body.name.trim();
    }

    for (const field of ['description', 'address', 'phone', 'email', 'whatsapp', 'hours']) {
        if (body[field] !== undefined) {
            data[field] = typeof body[field] === 'string' ? body[field].trim() : String(body[field]);
        }
    }

    if (body.social !== undefined) {
        if (typeof body.social !== 'object' || body.social === null || Array.isArray(body.social)) {
            return { error: 'Las redes sociales deben enviarse como un objeto' };
        }

        data.social = {};

        for (const network of ['facebook', 'instagram', 'twitter', 'linkedin']) {
            if (body.social[network] !== undefined) {
                data.social[network] = typeof body.social[network] === 'string'
                    ? body.social[network].trim()
                    : String(body.social[network]);
            }
        }
    }

    return { data };
}

// Borra el logo anterior del disco (mejor esfuerzo: si falla, no rompe la subida)
function removePreviousLogo(previousLogo, currentLogo) {
    if (!previousLogo || previousLogo === currentLogo || !previousLogo.startsWith('/uploads/')) {
        return;
    }

    try {
        fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(previousLogo)));
    } catch (error) {
        console.error('No se pudo borrar el logo anterior: ', error.message);
    }
}

// GET /api/store-info - información institucional (sin token)
export async function getStoreInfo(req, res) {
    const storeInfo = await getStoreInfoRepository().get();

    res.json(storeInfo);
}

// PUT /api/store-info - actualiza los datos institucionales (solo admin)
export async function updateStoreInfo(req, res) {
    const { data, error } = pickStoreInfoFields(req.body);
    if (error) {
        return res.status(400).json({ message: error });
    }

    const storeInfo = await getStoreInfoRepository().update(data);

    res.json(storeInfo);
}

// POST /api/store-info/logo - sube el logo del comercio (solo admin)
export async function uploadLogo(req, res) {
    if (!req.file) {
        return res.status(400).json({ message: 'Debe adjuntar una imagen en el campo "logo"' });
    }

    const repository = getStoreInfoRepository();
    const current = await repository.get();
    const logo = `/uploads/${req.file.filename}`;

    const storeInfo = await repository.update({ logo });
    removePreviousLogo(current.logo, logo);

    res.json(storeInfo);
}
