import Profile from '../models/Profile.js';
import ProfileSql from '../modelsSql/Profile.js';

class MongoProfileRepository {
    getByUserId(userId) {
        return Profile.findOne({ user: userId });
    }
    
    create(userId, data) {
        return Profile.create({ user: userId, ...data });
    }
    
    updateByUserId(userId, data) {
        return Profile.findOneAndUpdate({ user: userId }, data, { new: true, runValidators: true });
    }
}

class SqlProfileRepository {
    getByUserId(userId) {
        return ProfileSql.findOne({ where: { userId } });
    }
    
    create(userId, data) {
        return ProfileSql.create({ userId, ...data });
    }
    
    async updateByUserId(userId, data) {
        const profile = await ProfileSql.findOne({ where: { userId } });
        return profile ? profile.update(data) : null;
    }
}

export function getProfileRepository() {
    return process.env.DB_TYPE === 'sql' ? new SqlProfileRepository() : new MongoProfileRepository();
}