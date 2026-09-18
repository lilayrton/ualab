// Error handler central. Express 5 propaga automáticamente aquí los rechazos de los handlers async
export function errorHandler(error, req, res, next) {
    const status = getStatus(error);

    if (status >= 500) {
        console.error(error);
    } else {
        console.error(`[${status}] ${error.message}`);
    }

    // Nunca exponemos detalles internos fuera del entorno de desarrollo
    const message = process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message;

    return res.status(status).json({ message });
}

// Resuelve el código HTTP según el tipo de error
function getStatus(error) {
    // Errores con status propio (body-parser, multer, etc.)
    if (error.status && error.status >= 400 && error.status < 600) {
        return error.status;
    }

    // Id malformado de Mongo (CastError) → no existe el recurso
    if (error.name === 'CastError') {
        return 404;
    }

    // Fallos de validación de modelos → es un problema de la request, no del servidor
    if (error.name === 'ValidationError' || error.name === 'SequelizeValidationError') {
        return 400;
    }

    // Violación de unicidad (Mongo E11000 / Sequelize unique) → conflicto con datos existentes
    if (error.code === 11000 || error.name === 'SequelizeUniqueConstraintError') {
        return 409;
    }

    // Malformed JSON del body
    if (error.type === 'entity.parse.failed') {
        return 400;
    }

    return 500;
}