import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';

class ProductVariant extends Model {}

ProductVariant.init({
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sku: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'ProductVariant',
    tableName: 'productvariants',
    timestamps: true
});

export default ProductVariant;