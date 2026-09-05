import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';

class Profile extends Model {}

Profile.init({
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isCompany: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    dni: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cuit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    companyName: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Profile',
    tableName: 'profiles'
});

export default Profile;