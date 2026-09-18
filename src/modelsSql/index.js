import User from './User.js';
import Profile from './Profile.js';
import Category from './Category.js';
import Discount from './Discount.js';
import Product from './Product.js';
import ProductVariant from './ProductVariant.js';
import ProductCategory from './ProductCategory.js';
import StoreInfo from './StoreInfo.js';

User.hasOne(Profile, { foreignKey: 'userId', unique: true });
Profile.belongsTo(User, { foreignKey: 'userId' });

Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });
Category.hasMany(Category, { as: 'children', foreignKey: 'parentId' });

Discount.hasMany(Product, { as: 'discountedProducts', foreignKey: 'discountId' });
Product.belongsTo(Discount, { as: 'discount', foreignKey: 'discountId' });

Product.belongsToMany(Category, {
    through: ProductCategory,
    as: 'categories',
    foreignKey: 'productId',
    otherKey: 'categoryId'
});

Category.belongsToMany(Product, {
    through: ProductCategory,
    as: 'products',
    foreignKey: 'categoryId',
    otherKey: 'productId'
});

Product.hasMany(ProductVariant, { as: 'variants', foreignKey: 'productId' });
ProductVariant.belongsTo(Product, { as: 'product', foreignKey: 'productId' });

export { User, Profile, Category, Discount, Product, ProductVariant, ProductCategory, StoreInfo };