import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre es obligatorio'],
            trim: true
        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        image: {
            type: String,
            trim: true,
            default: ''
        },
        slug: {
            type: String,
            required: [true, 'El slug es obligatorio'],
            unique: true,
            lowercase: true,
            trim: true
        },
        isEnabled: {
            type: Boolean,
            default: true
        },
        sortOrder: {
            type: Number,
            default: 0
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
            index: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model('Category', categorySchema, 'categories');