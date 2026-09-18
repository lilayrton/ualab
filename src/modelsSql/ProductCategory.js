import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';

class ProductCategory extends Model {}

ProductCategory.init({
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'ProductCategory',
    tableName: 'product_categories',
    timestamps: false,
    indexes: [
        // Evita categorías duplicadas en un mismo producto
        { unique: true, fields: ['productId', 'categoryId'] },
        { fields: ['categoryId'] }
    ]
});

export default ProductCategory;