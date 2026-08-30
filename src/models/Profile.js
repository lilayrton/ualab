import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true // Aseguramos que haya sólo un perfil por usuario
        },
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        isCompany: {
            type: Boolean,
            default: false
        },
        dni: {
            type: String,
            trim: true
        },
        cuit: {
            type: String,
            trim: true
        },
        companyName: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

profileSchema.virtual('tieneDatosCompletos').get(function () {
    if (this.isCompany) {
        return Boolean(this.cuit && this.companyName);
    }

    return Boolean(this.dni);
});

export default mongoose.model('Profile', profileSchema, 'profiles');