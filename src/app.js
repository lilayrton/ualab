import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import storeInfoRoutes from './routes/storeInfoRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { UPLOAD_DIR } from './middlewares/upload.js';

const app = express();

app.disable('x-powered-by'); // No revelar que el servidor es Express

// Cuando la API esté en producción, confiamos en X-Forwarded-For
// Esto es para que el rate limiting y req.ip reflejen la IP real del cliente
if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
}

// CORS: solo los orígenes listados en CORS_ORIGIN (separados por coma). Con credentials para cookies.
const corsOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

// En producción no se puede dejar reflejar cualquier origen: si falta CORS_ORIGIN se deniegan
// las solicitudes cross-origin (la API queda utilizable solo desde el mismo origen o sin navegador).
if (isProduction && !corsOrigins.length) {
    console.warn('CORS: sin CORS_ORIGIN en producción se deniegan las solicitudes cross-origin.');
}

app.use(cors({
    origin: corsOrigins.length ? corsOrigins : !isProduction,
    credentials: true
}));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // cross-origin para las imágenes /uploads
app.use(compression()); // Comprime las respuestas para reducir el tráfico
app.use(morgan('dev', { skip: () => process.env.NODE_ENV === 'test' })); // Para loggear peticiones HTTP en consola
app.use(express.json()); // Para parsear payloads JSON entrantes
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_DIR)); // Archivos subidos (logos, imágenes)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/store-info', storeInfoRoutes);
app.use('/api/inquiries', inquiryRoutes);

// Ruta para probar
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// 404 en JSON para rutas API desconocidas (ocurre antes del error del handler)
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// Error handler central (debe registrarse al final, después de las rutas)
app.use(errorHandler);

export default app;