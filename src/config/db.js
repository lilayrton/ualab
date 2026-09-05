import mongoose from 'mongoose';
import sequelize from './sequelize.js';
import '../modelsSql/index.js'; // Registramos modelos y asociaciones antes de hacer sync()

export async function connectDB() {
    try {
        if (process.env.DB_TYPE === 'sql') {
            await sequelize.authenticate();
            await sequelize.sync(); // Crea tablas si no existen

            console.log(`Base ${process.env.DB_DIALECT} conectada correctamente`);
        } else {
            await mongoose.connect(process.env.DATABASE);
            
            console.log('MongoDB conectado correctamente');
        }
    } catch (error) {
        console.error('Error al conectar con MongoDB: ', error.message);
        process.exit(1);
    }
}