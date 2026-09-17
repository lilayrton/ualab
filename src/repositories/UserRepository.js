import User from '../models/User.js';
import UserSql from '../modelsSql/User.js';

class MongoUserRepository {
    getAll() {
        return User.find();
    }

    getById(id) {
        return User.findById(id);
    }
    
    getByEmail(email) {
        return User.findOne({ email }).select('+password');
    }

    emailExists(email) {
        return User.exists({ email });
    }

    create(data) {
        return User.create(data);
    }
    
    update(id, data) {
        return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async remove(id) {
        return User.findByIdAndDelete(id);
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
    getAll() {
        return UserSql.findAll();
    }

    getById(id) {
        return UserSql.findByPk(id);
    }
    
    getByEmail(email) {
        return UserSql.unscoped().findOne({ where: { email } });
    }

    emailExists(email) {
        return UserSql.findOne({ where: { email }, attributes: ['id'] });
    }
    
    create(data) {
        return UserSql.create(data);
    }
    
    async update(id, data) {
        const user = await UserSql.findByPk(id);

        return user ? user.update(data) : null;
    }

    async remove(id) {
        const deleted = await UserSql.destroy({ where: { id } });
        
        return deleted ? { id } : null;
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