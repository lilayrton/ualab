import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors()); // Para aceptar solicitudes de un dominio/puerto distinto al que la aplicación se hostea
app.use(morgan('dev')); // Para loggear peticiones HTTP en consola
app.use(express.json()); // Para parsear payloads JSON entrantes
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/discounts', discountRoutes);

// Ruta para probar
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Error handler central (debe registrarse al final, después de las rutas)
app.use(errorHandler);

export default app;