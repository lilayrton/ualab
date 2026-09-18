import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre es obligatorio'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'El email es obligatorio'],
            lowercase: true,
            trim: true,
            match: [/\S+@\S+\.\S+/, 'El email no es válido']
        },
        phone: { type: String, trim: true, default: '' },
        subject: { type: String, trim: true, default: '' },
        message: {
            type: String,
            required: [true, 'El mensaje es obligatorio'],
            trim: true
        },
        source: {
            type: String,
            enum: {
                values: ['contact', 'product'],
                message: 'El origen debe ser "contact" o "product"'
            },
            default: 'contact'
        },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
        productName: { type: String, trim: true, default: '' },
        productSku: { type: String, trim: true, default: '' },
        variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
        variantName: { type: String, trim: true, default: '' },
        variantSku: { type: String, trim: true, default: '' },
        status: {
            type: String,
            enum: {
                values: ['pending', 'read', 'replied'],
                message: 'El estado debe ser "pending", "read" o "replied"'
            },
            default: 'pending'
        },
        notified: { type: Boolean, default: false },
        readAt: { type: Date, default: null },
        repliedAt: { type: Date, default: null }
    },
    {
        timestamps: true
    }
);

export default mongoose.model('Inquiry', inquirySchema, 'inquiries');
