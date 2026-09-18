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
import {
    serializeProduct,
    serializeProductCandidate
} from '../utils/serializers.js';

const PRODUCT_INCLUDE = [
    { model: CategorySql, as: 'categories', through: { attributes: [] } },
    { model: DiscountSql, as: 'discount' },
    { model: ProductVariantSql, as: 'variants' }
];

// Soporte de transacciones multi-documento: se detecta la primera vez que se usa.
// null = sin evaluar todavía; true/false = resultado del chequeo del replica set.
let mongoTransactionSupport = null;

// MongoDB exige replica set para transacciones (Atlas de pago o mongo local con --replSet).
// En standalone o Atlas gratuito (M0) no hay transacciones y se usa el camino sin sesión.
async function mongoSupportsTransactions() {
    if (mongoTransactionSupport === null) {
        try {
            const hello = await Product.db.admin().command({ hello: 1 });
            mongoTransactionSupport = Boolean(hello.setName);
        } catch (error) {
            mongoTransactionSupport = false;
        }

        if (!mongoTransactionSupport) {
            console.warn('Mongo sin replica set: las operaciones multi-documento corren sin transacción');
        }
    }

    return mongoTransactionSupport;
}

// Ejecuta la operación dentro de una transacción de sesión cuando el deployment la soporta.
// Si no la soporta (o el servidor la rechaza puntualmente) se reintenta sin sesión.
async function withMongoTransaction(runInTransaction, runWithoutTransaction) {
    if (!(await mongoSupportsTransactions())) {
        return runWithoutTransaction();
    }

    const session = await Product.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            result = await runInTransaction(session);
        });

        return result;
    } catch (error) {
        if (/transaction numbers are only allowed|standalone/i.test(error.message || '')) {
            if (mongoTransactionSupport) {
                mongoTransactionSupport = false;
                console.warn('Transacción rechazada por el servidor: se usa el camino sin sesión');
            }

            return runWithoutTransaction();
        }

        throw error;
    } finally {
        await session.endSession();
    }
}

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

        return products.map(p => serializeProduct(
            p,
            {
                variants: variantsByProduct[String(p._id)] || [],
                discount: discountMap[String(p.discountId)] || null
            }
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

        return products.map(serializeProductCandidate);
    }

    async create(data, options = {}) {
        const { categories = [], variants = [] } = options;

        // Creación atómica: producto + variantes dentro de la misma transacción (si el deployment lo permite)
        const createInTransaction = async (session) => {
            const product = await Product.create({ ...data, categories }, { session });

            if (variants.length) {
                await ProductVariant.insertMany(
                    variants.map(v => ({ ...v, productId: product._id })),
                    { session }
                );
            }

            return product._id;
        };

        const createWithoutTransaction = async () => {
            const product = await Product.create({ ...data, categories });

            if (variants.length) {
                await ProductVariant.insertMany(variants.map(v => ({ ...v, productId: product._id })));
            }

            return product._id;
        };

        const productId = await withMongoTransaction(createInTransaction, createWithoutTransaction);

        return this.getById(productId);
    }

    async update(id, data, options = {}) {
        const { categories, variants } = options;
        const updateData = { ...data };

        if (categories !== undefined) {
            updateData.categories = categories;
        }

        // Actualización atómica: producto + reemplazo de variantes dentro de la misma transacción
        const updateInTransaction = async (session) => {
            const product = await Product.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
                session
            });

            if (!product) {
                return null;
            }

            if (variants !== undefined) {
                await this._replaceVariantsInTransaction(product._id, variants, session);
            }

            return product._id;
        };

        const updateWithoutTransaction = async () => {
            const product = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

            if (!product) {
                return null;
            }

            if (variants !== undefined) {
                await this._replaceVariantsInTransaction(product._id, variants);
            }

            return product._id;
        };

        const productId = await withMongoTransaction(updateInTransaction, updateWithoutTransaction);

        if (!productId) {
            return null;
        }

        return this.getById(productId);
    }

    // Borra y recrea las variantes de un producto (acepta sesión para transacciones o nada para el modo simple)
    async _replaceVariantsInTransaction(productId, variants, session = null) {
        await ProductVariant.deleteMany({ productId }, session ? { session } : {});

        if (variants?.length) {
            await ProductVariant.insertMany(
                variants.map(v => ({ ...v, productId })),
                session ? { session } : {}
            );
        }
    }

    async remove(id) {
        // Borrado atómico: variantes + producto dentro de la misma transacción (si el deployment lo permite)
        const removeInTransaction = async (session) => {
            const product = await Product.findByIdAndDelete(id, { session });

            if (!product) {
                return null;
            }

            await ProductVariant.deleteMany({ productId: id }, { session });

            return { id };
        };

        const removeWithoutTransaction = async () => {
            const product = await Product.findByIdAndDelete(id);

            if (!product) {
                return null;
            }

            await ProductVariant.deleteMany({ productId: id });

            return { id };
        };

        return withMongoTransaction(removeInTransaction, removeWithoutTransaction);
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

        return products.map(p => serializeProduct(p, { variants: p.variants || [], discount: p.discount || null }));
    }

    async getPublic() {
        const products = await ProductSql.findAll({
            where: { isEnabled: true },
            include: PRODUCT_INCLUDE,
            order: [['createdAt', 'DESC']]
        });

        return products.map(p => serializeProduct(p, { variants: p.variants || [], discount: p.discount || null }));
    }

    async getFeatured() {
        const products = await ProductSql.findAll({
            where: { isEnabled: true, isFeatured: true },
            include: PRODUCT_INCLUDE,
            order: [['createdAt', 'DESC']]
        });

        return products.map(p => serializeProduct(p, { variants: p.variants || [], discount: p.discount || null }));
    }

    async getNewUntil() {
        const products = await ProductSql.findAll({
            where: { isEnabled: true, newUntil: { [Op.gt]: new Date() } },
            include: PRODUCT_INCLUDE,
            order: [['createdAt', 'DESC']]
        });

        return products.map(p => serializeProduct(p, { variants: p.variants || [], discount: p.discount || null }));
    }

    async getById(id) {
        const product = await ProductSql.findByPk(id, { include: PRODUCT_INCLUDE });

        return product ? serializeProduct(product, { variants: product.variants || [], discount: product.discount || null }) : null;
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

        return ids.map(id => byId[id]).filter(Boolean)
            .map(p => serializeProduct(p, { variants: p.variants || [], discount: p.discount || null }));
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

        return products.map(serializeProductCandidate);
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