import User from './User.js';
import Profile from './Profile.js';
import Category from './Category.js';

User.hasOne(Profile, { foreignKey: 'userId', unique: true });
Profile.belongsTo(User, { foreignKey: 'userId' });

Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });
Category.hasMany(Category, { as: 'children', foreignKey: 'parentId' });

export { User, Profile, Category };