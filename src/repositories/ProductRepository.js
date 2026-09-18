import { Op } from 'sequelize';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import Discount from '../models/Discount.js';
import sequelize from '../config/sequelize.js';
import CategorySql from '../modelsSql/Category.js';
import DiscountSql from '../modelsSql/Discount.js';
import ProductSql from '../modelsSql/Product.js';
import ProductVariantSql from '../modelsSql/ProductVariant.js';
import ProductCategory from '../modelsSql/ProductCategory.js';
import { isProductNew } from '../utils/productBadges.js';

function serializeCategory(c) {
    return {
        id: String(c._id || c.id),
        name: c.name,
        slug: c.slug
    };
}

function serializeDiscount(d) {
    return {
        id: String(d._id || d.id),
        name: d.name,
        type: d.type,
        value: Number(d.value)
    };
}

function serializeVariant(v) {
    return {
        id: String(v._id || v.id),
        name: v.name,
        sku: v.sku,
        price: Number(v.price),
        stock: v.stock
    };
}

function serializeMongoProduct(p, variants, discount) {
    return {
        id: String(p._id),
        name: p.name,
        sku: p.sku,
        images: p.images || [],
        shortDescription: p.shortDescription || '',
        longDescription: p.longDescription || '',
        price: Number(p.price),
        stock: p.stock,
        isEnabled: p.isEnabled,
        isFeatured: p.isFeatured === true,
        isNew: isProductNew(p.newUntil),
        categories: (p.categories || []).map(serializeCategory),
        discount: discount ? serializeDiscount(discount) : null,
        variants: variants.map(serializeVariant),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
    };
}

function serializeSqlProduct(p) {
    return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        images: p.images || [],
        shortDescription: p.shortDescription || '',
        longDescription: p.longDescription || '',
        price: Number(p.price),
        stock: p.stock,
        isEnabled: p.isEnabled,
        isFeatured: p.isFeatured === true,
        isNew: isProductNew(p.newUntil),
        categories: (p.categories || []).map(serializeCategory),
        discount: p.discount ? serializeDiscount(p.discount) : null,
        variants: (p.variants || []).map(serializeVariant),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
    };
}

const PRODUCT_INCLUDE = [
    { model: CategorySql, as: 'categories', through: { attributes: [] } },
    { model: DiscountSql, as: 'discount' },
    { model: ProductVariantSql, as: 'variants' }
];

class MongoProductRepository {
    // Completa cada producto con sus variantes y el descuento asociado
    async _hydrate(products) {
        if (!products.length) {
            return [];
        }

        const productIds = products.map(p => p._id);
        const variants = await ProductVariant.find({ productId: { $in: productIds } }).lean();
        const discountIds = [...new Set(products.map(p => p.discountId).filter(Boolean))];
        const discounts = discountIds.length ? await Discount.find({ _id: { $in: discountIds } }).lean() : [];
        const variantsByProduct = {};
        const discountMap = {};

        variants.forEach(v => {
            const key = String(v.productId);

            if (!variantsByProduct[key]) {
                variantsByProduct[key] = [];
            }

            variantsByProduct[key].push(v);
        });

        discounts.forEach(d => {
            discountMap[String(d._id)] = d;
        });

        return products.map(p => serializeMongoProduct(
            p,
            variantsByProduct[String(p._id)] || [],
            discountMap[String(p.discountId)] || null
        ));
    }

    async getAll() {
        const products = await Product.find().sort({ createdAt: -1 }).populate('categories').lean();

        return this._hydrate(products);
    }

    async getPublic() {
        const products = await Product.find({ isEnabled: true }).sort({ createdAt: -1 }).populate('categories').lean();

        return this._hydrate(products);
    }

    async getFeatured() {
        const products = await Product.find({ isEnabled: true, isFeatured: true }).sort({ createdAt: -1 }).populate('categories').lean();

        return this._hydrate(products);
    }

    async getNewUntil() {
        const products = await Product.find({ isEnabled: true, newUntil: { $gt: new Date() } }).sort({ createdAt: -1 }).populate('categories').lean();

        return this._hydrate(products);
    }

    async getById(id) {
        const product = await Product.findById(id).populate('categories').lean();

        if (!product) {
            return null;
        }

        const hydrated = await this._hydrate([product]);

        return hydrated[0];
    }

    async getByIds(ids) {
        if (!ids.length) {
            return [];
        }

        const products = await Product.find({ _id: { $in: ids } }).populate('categories').lean();
        const byId = {};

        products.forEach(p => {
            byId[String(p._id)] = p;
        });

        const ordered = ids.map(id => byId[String(id)]).filter(Boolean);

        return this._hydrate(ordered);
    }

    // Documentos mínimos para alimentar el índice de búsqueda en memoria
    async getSearchDocuments() {
        const products = await Product.find({}, 'name sku shortDescription longDescription').lean();

        return products.map(p => ({
            id: String(p._id),
            name: p.name,
            sku: p.sku,
            shortDescription: p.shortDescription || '',
            longDescription: p.longDescription || ''
        }));
    }

    // Candidatos mínimos (con categorías) para filtros, facetas y orden en memoria
    async findCandidates(ids = null) {
        const filter = ids ? { _id: { $in: ids } } : {};
        const products = await Product.find(filter, 'name sku price stock isEnabled isFeatured newUntil createdAt').populate('categories').lean();

        return products.map(p => ({
            id: String(p._id),
            name: p.name,
            sku: p.sku,
            price: Number(p.price),
            stock: p.stock,
            isEnabled: p.isEnabled,
            isFeatured: p.isFeatured === true,
            newUntil: p.newUntil || null,
            createdAt: p.createdAt,
            categories: (p.categories || []).map(serializeCategory)
        }));
    }

    async create(data, options = {}) {
        const { categories = [], variants = [] } = options;
        const product = await Product.create({ ...data, categories });

        if (variants.length) {
            await ProductVariant.insertMany(variants.map(v => ({ ...v, productId: product._id })));
        }

        return this.getById(product._id);
    }

    async update(id, data, options = {}) {
        const { categories, variants } = options;
        const updateData = { ...data };

        if (categories !== undefined) {
            updateData.categories = categories;
        }

        const product = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!product) {
            return null;
        }

        if (variants !== undefined) {
            await ProductVariant.deleteMany({ productId: product._id });

            if (variants.length) {
                await ProductVariant.insertMany(variants.map(v => ({ ...v, productId: product._id })));
            }
        }

        return this.getById(product._id);
    }

    async remove(id) {
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return null;
        }

        await ProductVariant.deleteMany({ productId: id });

        return { id };
    }

    getVariants(productId) {
        return ProductVariant.find({ productId });
    }

    existsByDiscount(discountId) {
        return Product.exists({ discountId });
    }

    skuExists(sku, excludeId = null) {
        const filter = { sku };

        if (excludeId) {
            filter._id = { $ne: excludeId };
        }

        return Product.exists(filter);
    }

    variantSkuExists(sku, excludeVariantId = null) {
        const filter = { sku };

        if (excludeVariantId) {
            filter._id = { $ne: excludeVariantId };
        }

        return ProductVariant.exists(filter);
    }

    // Variante con ese SKU que pertenece a OTRO producto (para el cruce producto ↔ variante)
    variantSkuExistsForOtherProduct(sku, productId) {
        return ProductVariant.exists({ sku, productId: { $ne: productId } });
    }
}

class SqlProductRepository {
    async getAll() {
        const products = await ProductSql.findAll({ include: PRODUCT_INCLUDE, order: [['createdAt', 'DESC']] });

        return products.map(serializeSqlProduct);
    }

    async getPublic() {
        const products = await ProductSql.findAll({
            where: { isEnabled: true },
            include: PRODUCT_INCLUDE,
            order: [['createdAt', 'DESC']]
        });

        return products.map(serializeSqlProduct);
    }

    async getFeatured() {
        const products = await ProductSql.findAll({
            where: { isEnabled: true, isFeatured: true },
            include: PRODUCT_INCLUDE,
            order: [['createdAt', 'DESC']]
        });

        return products.map(serializeSqlProduct);
    }

    async getNewUntil() {
        const products = await ProductSql.findAll({
            where: { isEnabled: true, newUntil: { [Op.gt]: new Date() } },
            include: PRODUCT_INCLUDE,
            order: [['createdAt', 'DESC']]
        });

        return products.map(serializeSqlProduct);
    }

    async getById(id) {
        const product = await ProductSql.findByPk(id, { include: PRODUCT_INCLUDE });

        return product ? serializeSqlProduct(product) : null;
    }

    async getByIds(ids) {
        if (!ids.length) {
            return [];
        }

        const products = await ProductSql.findAll({ where: { id: { [Op.in]: ids } }, include: PRODUCT_INCLUDE });
        const byId = {};

        products.forEach(p => {
            byId[p.id] = p;
        });

        return ids.map(id => byId[id]).filter(Boolean).map(serializeSqlProduct);
    }

    // Documentos mínimos para alimentar el índice de búsqueda en memoria
    async getSearchDocuments() {
        const products = await ProductSql.findAll({ attributes: ['id', 'name', 'sku', 'shortDescription', 'longDescription'] });

        return products.map(p => ({
            id: String(p.id),
            name: p.name,
            sku: p.sku,
            shortDescription: p.shortDescription || '',
            longDescription: p.longDescription || ''
        }));
    }

    // Candidatos mínimos (con categorías) para filtros, facetas y orden en memoria
    async findCandidates(ids = null) {
        const where = ids ? { id: { [Op.in]: ids } } : {};
        const products = await ProductSql.findAll({
            where,
            attributes: ['id', 'name', 'sku', 'price', 'stock', 'isEnabled', 'isFeatured', 'newUntil', 'createdAt'],
            include: [{ model: CategorySql, as: 'categories', through: { attributes: [] } }]
        });

        return products.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            price: Number(p.price),
            stock: p.stock,
            isEnabled: p.isEnabled,
            isFeatured: p.isFeatured === true,
            newUntil: p.newUntil || null,
            createdAt: p.createdAt,
            categories: (p.categories || []).map(serializeCategory)
        }));
    }

    async create(data, options = {}) {
        const { categories = [], variants = [] } = options;
        const transaction = await sequelize.transaction();

        try {
            const product = await ProductSql.create(data, { transaction });

            if (categories.length) {
                await ProductCategory.bulkCreate(categories.map(categoryId => ({ productId: product.id, categoryId })), { transaction });
            }

            if (variants.length) {
                await ProductVariantSql.bulkCreate(variants.map(v => ({ ...v, productId: product.id })), { transaction });
            }

            await transaction.commit();

            return this.getById(product.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async update(id, data, options = {}) {
        const { categories, variants } = options;
        const product = await ProductSql.findByPk(id);

        if (!product) {
            return null;
        }

        const transaction = await sequelize.transaction();

        try {
            await product.update(data, { transaction });

            if (categories !== undefined) {
                await ProductCategory.destroy({ where: { productId: id }, transaction });

                if (categories.length) {
                    await ProductCategory.bulkCreate(categories.map(categoryId => ({ productId: id, categoryId })), { transaction });
                }
            }

            if (variants !== undefined) {
                await this._replaceVariantsSql(id, variants, transaction);
            }

            await transaction.commit();

            return this.getById(id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async _replaceVariantsSql(productId, variants, transaction) {
        await ProductVariantSql.destroy({ where: { productId }, transaction });

        if (variants.length) {
            await ProductVariantSql.bulkCreate(variants.map(v => ({ ...v, productId })), { transaction });
        }
    }

    async remove(id) {
        const product = await ProductSql.findByPk(id);
        if (!product) {
            return null;
        }

        const transaction = await sequelize.transaction();

        try {
            await ProductVariantSql.destroy({ where: { productId: id }, transaction });
            await ProductCategory.destroy({ where: { productId: id }, transaction });
            await product.destroy({ transaction });
            await transaction.commit();

            return { id };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    getVariants(productId) {
        return ProductVariantSql.findAll({ where: { productId } });
    }

    async existsByDiscount(discountId) {
        return !!(await ProductSql.findOne({ where: { discountId }, attributes: ['id'] }));
    }

    async skuExists(sku, excludeId = null) {
        const where = { sku };

        if (excludeId) {
            where.id = { [Op.ne]: excludeId };
        }

        return !!(await ProductSql.findOne({ where, attributes: ['id'] }));
    }

    async variantSkuExists(sku, excludeVariantId = null) {
        const where = { sku };

        if (excludeVariantId) {
            where.id = { [Op.ne]: excludeVariantId };
        }

        return !!(await ProductVariantSql.findOne({ where, attributes: ['id'] }));
    }

    // Variante SKU que pertenece a otro producto
    async variantSkuExistsForOtherProduct(sku, productId) {
        return !!(await ProductVariantSql.findOne({ where: { sku, productId: { [Op.ne]: productId } }, attributes: ['id'] }));
    }
}

export function getProductRepository() {
    return process.env.DB_TYPE === 'sql' ? new SqlProductRepository() : new MongoProductRepository();
}