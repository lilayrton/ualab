import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';

dotenv.config(); // Para cargar variables de entorno desde el archivo .env

const app = express();
const HOST = process.env.HOST;
const PORT = process.env.PORT;
const DATABASE = process.env.DATABASE;

app.use(cors()); // Para aceptar solicitudes de un dominio/puerto distinto al que la aplicación se hostea
app.use(morgan('dev')); // Para loggear peticiones HTTP en consola
app.use(bodyParser.json()); // Para parsear payloads JSON entrantes
app.use(bodyParser.urlencoded({ encoded: true }));

// Ruta para probar
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

async function startServer() {
    try {
        await mongoose.connect(DATABASE);
        console.log('Conectado correctamente a la base de datos');

        app.listen(PORT, () => {
            console.log(`El servidor Express está corriendo en http://${HOST}:${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor o conectar con la base de datos: ', error.message);
        process.exit(1);
    }
}

startServer();