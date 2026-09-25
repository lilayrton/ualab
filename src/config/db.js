import mongoose from 'mongoose';
import sequelize from './sequelize.js';
import '../modelsSql/index.js'; // Registramos modelos y asociaciones antes de hacer sync()
import { createDatabaseIfNotExists } from '../utils/createDatabase.js';

export async function connectDB() {
    try {
        if (process.env.DB_TYPE === 'sql') {
            if (process.env.DB_AUTO_CREATE === 'true') {
                await createDatabaseIfNotExists();
            }

            await sequelize.authenticate();
            await sequelize.sync(); // Crea tablas si no existen

            console.log(`Base ${process.env.DB_DIALECT} conectada correctamente`);
        } else {
            await mongoose.connect(process.env.DATABASE);
            
            console.log('MongoDB conectado correctamente');
        }
    } catch (error) {
        console.error('Error al conectar con la base de datos: ', error.message);
        process.exit(1);
    }
}