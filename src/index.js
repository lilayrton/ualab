import 'dotenv/config'; // Para cargar variables de entorno desde el archivo .env
import app from './app.js';
import { connectDB } from './config/db.js';

const HOST = process.env.HOST;
const PORT = process.env.PORT;

async function startServer() {
    await connectDB();

    app.listen(PORT, HOST, () => {
        console.log(`El servidor Express está corriendo en http://${HOST}:${PORT}`);
    });
}

startServer();