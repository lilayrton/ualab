import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';

class Discount extends Model {}

Discount.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('amount', 'percent'),
        allowNull: false
    },
    value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    isEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    validFrom: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    validTo: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    }
}, {
    sequelize,
    modelName: 'Discount',
    tableName: 'discounts',
    timestamps: true
});

export default Discount;