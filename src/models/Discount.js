import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre del descuento es obligatorio'],
            trim: true
        },
        type: {
            type: String,
            enum: {
                values: ['amount', 'percent'],
                message: 'El tipo de descuento debe ser "amount" o "percent"'
            },
            required: [true, 'El tipo de descuento es obligatorio']
        },
        value: {
            type: Number,
            required: [true, 'El valor del descuento es obligatorio'],
            min: [0, 'El valor del descuento no puede ser negativo'],
            validate: {
                validator(value) {
                    if (this.type === 'percent') {
                        return value <= 100;
                    }

                    return value >= 0;
                },
                message: 'El valor de un descuento porcentual no puede superar 100'
            }
        },
        isEnabled: {
            type: Boolean,
            default: true
        },
        validFrom: {
            type: Date,
            default: null
        },
        validTo: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model('Discount', discountSchema, 'discounts');