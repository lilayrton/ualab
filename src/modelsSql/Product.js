import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';

class Product extends Model {}

Product.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sku: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    images: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    shortDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    longDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    isEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    isFeatured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    newUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    discountId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    }
}, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true
});

export default Product;