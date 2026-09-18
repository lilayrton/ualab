import mongoose from 'mongoose';

// Documento único (singleton): siempre usamos el _id fijo 1
const storeInfoSchema = new mongoose.Schema(
    {
        _id: { type: Number, default: 1 },
        name: {
            type: String,
            required: [true, 'El nombre del comercio es obligatorio'],
            trim: true
        },
        description: { type: String, trim: true, default: '' },
        address: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
        email: { type: String, trim: true, default: '' },
        whatsapp: { type: String, trim: true, default: '' },
        logo: { type: String, trim: true, default: '' },
        hours: { type: String, trim: true, default: '' },
        social: {
            facebook: { type: String, trim: true, default: '' },
            instagram: { type: String, trim: true, default: '' },
            twitter: { type: String, trim: true, default: '' },
            linkedin: { type: String, trim: true, default: '' }
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model('StoreInfo', storeInfoSchema, 'store_infos');
