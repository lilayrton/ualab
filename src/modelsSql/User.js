import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

class User extends Model {}

User.init({
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
        validate: { isIn: [['admin', 'user']] }
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    defaultScope: { attributes: { exclude: ['password'] } }
});

User.beforeCreate(async (user) => {
    user.password = await hashPassword(user.password);
});

User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
        user.password = await hashPassword(user.password);
    }
});

User.prototype.comparePassword = function (loginPassword) {
    return verifyPassword(loginPassword, this.password);
};

export default User;