import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';

const app = express();

app.use(cors()); // Para aceptar solicitudes de un dominio/puerto distinto al que la aplicación se hostea
app.use(morgan('dev')); // Para loggear peticiones HTTP en consola
app.use(bodyParser.json()); // Para parsear payloads JSON entrantes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/categories', categoryRoutes);

// Ruta para probar
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

export default app;