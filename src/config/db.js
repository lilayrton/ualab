import mongoose from 'mongoose';

export async function connectDB() {
    try {
        const uri = process.env.DATABASE;

        await mongoose.connect(uri);
        console.log('MongoDB Atlas conectado correctamente');
    } catch (error) {
        console.error('Error al conectar con MongoDB Atlas: ', error.message);
        process.exit(1);
    }
}