import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'El email es obligatorio'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/\S+@\S+\.\S+/, 'El email no es válido']
        },
        password: {
            type: String,
            required: [true, 'La contraseña es obligatoria'],
            minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
            select: false // Así evitamos traer la contraseña al hacer una consulta
        },
        role: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user'
        }
    },
    {
        timestamps: true // Se agregan campos createdAt y updatedAt automáticamente
    }
);

// Hash de la contraseña antes de guardar el documento
userSchema.pre('save', async function () {
    // this es el documento. Sólo hasheamos si la contraseña fue modificada
    if (!this.isModified('password'))
        return;

    const salt = await bcrypt.genSalt(10); // El algoritmo hace 2^10 iteraciones de hashing (1024)
    this.password = await bcrypt.hash(this.password, salt);
});

// Comparador de contraseñas al hacer login
userSchema.methods.comparePassword = function (loginPassword) {
    return bcrypt.compare(loginPassword, this.password);
};

export default mongoose.model('User', userSchema, 'users');