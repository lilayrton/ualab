import User from '../models/User.js';
import UserSql from '../modelsSql/User.js';
import { serializeUser } from '../utils/serializers.js';

class MongoUserRepository {
    async getAll() {
        const users = await User.find();

        return users.map(serializeUser);
    }

    async getById(id) {
        const user = await User.findById(id);

        return user ? serializeUser(user) : null;
    }

    // Se mantiene sin serializar: login necesita acceso a la contraseña para comparar
    getByEmail(email) {
        return User.findOne({ email }).select('+password');
    }

    emailExists(email) {
        return User.exists({ email });
    }

    async create(data) {
        const user = await User.create(data);

        return serializeUser(user);
    }

    async update(id, data) {
        const user = await User.findById(id);

        if (!user) {
            return null;
        }

        // Se usa save() (y no findByIdAndUpdate) para que el hook pre('save')
        // hashee la contraseña cuando el admin la cambia.
        if (data.password !== undefined) {
            user.password = data.password;
        }

        if (data.email !== undefined) {
            user.email = data.email;
        }

        if (data.role !== undefined) {
            user.role = data.role;
        }

        await user.save();

        return serializeUser(user);
    }

    async remove(id) {
        const deleted = await User.findByIdAndDelete(id);

        return deleted ? { id } : null;
    }

    // Con contraseña incluida (para comparar en change-password o similar)
    getByIdRaw(id) {
        return User.findById(id).select('+password');
    }

    count() {
        return User.countDocuments();
    }

    // Se usa save() en vez de findByIdAndUpdate para que el hook pre('save') hashee la contraseña
    async updatePassword(id, newPassword) {
        const user = await User.findById(id);

        if (!user) {
            return null;
        }

        user.password = newPassword;
        return user.save();
    }
}

class SqlUserRepository {
    async getAll() {
        const users = await UserSql.findAll();

        return users.map(serializeUser);
    }

    async getById(id) {
        const user = await UserSql.findByPk(id);

        return user ? serializeUser(user) : null;
    }

    // Se mantiene sin serializar: login necesita acceso a la contraseña para comparar
    getByEmail(email) {
        return UserSql.unscoped().findOne({ where: { email } });
    }

    emailExists(email) {
        return UserSql.findOne({ where: { email }, attributes: ['id'] });
    }

    async create(data) {
        const user = await UserSql.create(data);

        return serializeUser(user);
    }

    async update(id, data) {
        const user = await UserSql.findByPk(id);

        return user ? serializeUser(await user.update(data)) : null;
    }

    async remove(id) {
        const deleted = await UserSql.destroy({ where: { id } });

        return deleted ? { id } : null;
    }

    // Con contraseña incluida (para comparar en change-password o similar)
    getByIdRaw(id) {
        return UserSql.unscoped().findByPk(id);
    }

    count() {
        return UserSql.count();
    }

    // Se usa instance.update() para que el hook beforeUpdate hashee la contraseña
    async updatePassword(id, newPassword) {
        const user = await UserSql.findByPk(id);

        if (!user) {
            return null;
        }

        return user.update({ password: newPassword });
    }
}

export function getUserRepository() {
    return process.env.DB_TYPE === 'sql' ? new SqlUserRepository() : new MongoUserRepository();
}