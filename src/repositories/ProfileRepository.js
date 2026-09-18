import Profile from '../models/Profile.js';
import ProfileSql from '../modelsSql/Profile.js';
import { serializeProfile } from '../utils/serializers.js';

class MongoProfileRepository {
    async getByUserId(userId) {
        const profile = await Profile.findOne({ user: userId });

        return profile ? serializeProfile(profile) : null;
    }

    async create(userId, data) {
        const profile = await Profile.create({ user: userId, ...data });

        return serializeProfile(profile);
    }

    async updateByUserId(userId, data) {
        const profile = await Profile.findOneAndUpdate({ user: userId }, data, { new: true, runValidators: true });

        return profile ? serializeProfile(profile) : null;
    }
}

class SqlProfileRepository {
    async getByUserId(userId) {
        const profile = await ProfileSql.findOne({ where: { userId } });

        return profile ? serializeProfile(profile) : null;
    }

    async create(userId, data) {
        const profile = await ProfileSql.create({ userId, ...data });

        return serializeProfile(profile);
    }

    async updateByUserId(userId, data) {
        const profile = await ProfileSql.findOne({ where: { userId } });

        if (!profile) {
            return null;
        }

        return serializeProfile(await profile.update(data));
    }
}

export function getProfileRepository() {
    return process.env.DB_TYPE === 'sql' ? new SqlProfileRepository() : new MongoProfileRepository();
}