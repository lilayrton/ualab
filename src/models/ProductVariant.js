import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'La variante debe pertenecer a un producto'],
            index: true
        },
        name: {
            type: String,
            required: [true, 'El nombre de la variante es obligatorio'],
            trim: true
        },
        sku: {
            type: String,
            required: [true, 'El SKU de la variante es obligatorio'],
            unique: true,
            uppercase: true,
            trim: true
        },
        price: {
            type: Number,
            required: [true, 'El precio de la variante es obligatorio'],
            min: [0, 'El precio no puede ser negativo']
        },
        stock: {
            type: Number,
            required: [true, 'El stock de la variante es obligatorio'],
            min: [0, 'El stock no puede ser negativo']
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model('ProductVariant', productVariantSchema, 'productvariants');