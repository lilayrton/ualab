import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';

class Inquiry extends Model {}

Inquiry.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: true
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    source: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'contact',
        validate: { isIn: [['contact', 'product']] }
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    productSku: {
        type: DataTypes.STRING,
        allowNull: true
    },
    variantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    variantName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    variantSku: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: { isIn: [['pending', 'read', 'replied']] }
    },
    notified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    readAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    repliedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    }
}, {
    sequelize,
    modelName: 'Inquiry',
    tableName: 'inquiries',
    timestamps: true
});

export default Inquiry;
