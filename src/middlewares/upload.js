import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Directorio de subida definido en .env (por defecto img/)
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'img';

// Nos aseguramos de que el directorio exista antes de recibir archivos
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_IMAGES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `logo-${unique}${extension}`);
    }
});

function imageFilter(req, file, cb) {
    if (!ALLOWED_IMAGES.includes(file.mimetype)) {
        return cb(new Error('El archivo debe ser una imagen (png, jpg, webp o gif)'));
    }

    cb(null, true);
}

const upload = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 2 * 1024 * 1024 } });

// Envuelve a multer para responder 400 ante errores de subida (tipo o tamaño inválidos)
export function uploadSingle(field) {
    return (req, res, next) => {
        upload.single(field)(req, res, (error) => {
            if (error) {
                return res.status(400).json({ message: error.message });
            }

            next();
        });
    };
}

export { UPLOAD_DIR };
