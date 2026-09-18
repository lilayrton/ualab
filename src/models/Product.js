import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre del producto es obligatorio'],
            trim: true
        },
        sku: {
            type: String,
            required: [true, 'El SKU del producto es obligatorio'],
            unique: true,
            uppercase: true,
            trim: true
        },
        images: {
            type: [String],
            default: [],
            validate: {
                validator(images) {
                    return images.length <= 5;
                },
                message: 'Un producto no puede tener más de 5 imágenes'
            }
        },
        shortDescription: {
            type: String,
            trim: true,
            default: ''
        },
        longDescription: {
            type: String,
            trim: true,
            default: ''
        },
        price: {
            type: Number,
            required: [true, 'El precio del producto es obligatorio'],
            min: [0, 'El precio no puede ser negativo']
        },
        stock: {
            type: Number,
            required: [true, 'El stock del producto es obligatorio'],
            min: [0, 'El stock no puede ser negativo']
        },
        isEnabled: {
            type: Boolean,
            default: true
        },
        isFeatured: {
            type: Boolean,
            default: false
        },
        newUntil: {
            type: Date,
            default: null
        },
        categories: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'Category',
            default: [],
            index: true
        },
        discountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Discount',
            default: null,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Índices para las queries más usadas
productSchema.index({ createdAt: -1 }); // Listados ordenados por más reciente
productSchema.index({ isEnabled: 1, isFeatured: 1 }); // Vidriera de destacados
productSchema.index({ isEnabled: 1, newUntil: 1 }); // Vidriera de novedades

export default mongoose.model('Product', productSchema, 'products');