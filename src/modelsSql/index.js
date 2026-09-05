import User from './User.js';
import Profile from './Profile.js';

User.hasOne(Profile, { foreignKey: 'userId', unique: true });
Profile.belongsTo(User, { foreignKey: 'userId' });

export { User, Profile };