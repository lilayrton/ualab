// Error handler central. Express 5 propaga automáticamente aquí los rechazos de los handlers async
export function errorHandler(error, req, res, next) {
    console.error(error);

    if (process.env.NODE_ENV !== 'production') {
        return res.status(500).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Error interno del servidor' });
}