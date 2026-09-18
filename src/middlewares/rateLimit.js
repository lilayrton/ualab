// Limitador de frecuencia en memoria por IP (ventana deslizante).
// Suficiente para una sola instancia del servidor; no persiste ni se comparte entre réplicas.
const hits = new Map();

function prune(now, windowMs) {
    for (const [key, timestamps] of hits) {
        const recent = timestamps.filter(time => now - time < windowMs);

        if (recent.length) {
            hits.set(key, recent);
        } else {
            hits.delete(key);
        }
    }
}

export function rateLimit({ windowMs, max, message = 'Demasiadas solicitudes. Intentá nuevamente más tarde.' } = {}) {
    const windowMillis = windowMs ?? (Number(process.env.INQUIRY_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000);
    const maxRequests = max ?? (Number(process.env.INQUIRY_RATE_LIMIT_MAX) || 5);

    return (req, res, next) => {
        const now = Date.now();

        if (hits.size > 5000) {
            prune(now, windowMillis);
        }

        const key = req.ip;
        const timestamps = (hits.get(key) || []).filter(time => now - time < windowMillis);

        if (timestamps.length >= maxRequests) {
            hits.set(key, timestamps);

            return res.status(429).json({ message });
        }

        timestamps.push(now);
        hits.set(key, timestamps);

        next();
    };
}
