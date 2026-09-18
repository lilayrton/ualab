import { Op } from 'sequelize';
import Category from '../models/Category.js';
import CategorySql from '../modelsSql/Category.js';
import { buildTree, isDescendant } from '../utils/categoryTree.js';
import { serializeCategory } from '../utils/serializers.js';

class MongoCategoryRepository {
    async getAll() {
        const categories = await Category.find().sort({ sortOrder: 1, name: 1});

        return categories.map(serializeCategory);
    }

    async getById(id) {
        const category = await Category.findById(id);

        return category ? serializeCategory(category) : null;
    }

    getByIds(ids) {
        return Category.find({ _id: { $in: ids } });
    }

    async getTree({ onlyEnabled = false } = {}) {
        const categories = await Category.find().lean();

        return buildTree(categories, { onlyEnabled });
    }

    async create(data) {
        const category = await Category.create(data);

        return serializeCategory(category);
    }

    async update(id, data) {
        const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });

        return category ? serializeCategory(category) : null;
    }

    async remove(id) {
        return Category.findByIdAndDelete(id);
    }

    hasChildren(id) {
        return Category.exists({ parentId: id });
    }

    slugExists(slug, excludeId = null) {
        const filter = { slug };

        if (excludeId) {
            filter._id = { $ne: excludeId };
        }

        return Category.exists(filter);
    }

    async hasAncestor(id, candidateId) {
        const all = await Category.find({}, '_id parentId').lean();
        const flat = all.map(c => ({ id: String(c._id), parentId: c.parentId ? String(c.parentId) : null }));

        return isDescendant(flat, String(id), String(candidateId));
    }
}

class SqlCategoryRepository {
    async getAll() {
        const categories = await CategorySql.findAll({ order: [['sortOrder', 'ASC'], ['name', 'ASC']] });

        return categories.map(serializeCategory);
    }

    async getById(id) {
        const category = await CategorySql.findByPk(id);

        return category ? serializeCategory(category) : null;
    }

    async getByIds(ids) {
        return CategorySql.findAll({ where: { id: { [Op.in]: ids } } });
    }

    async getTree({ onlyEnabled = false } = {}) {
        const where = onlyEnabled ? { isEnabled: true } : {};
        const categories = await CategorySql.findAll({ where });

        return buildTree(categories, { onlyEnabled });
    }

    async create(data) {
        const category = await CategorySql.create(data);

        return serializeCategory(category);
    }

    async update(id, data) {
        const category = await CategorySql.findByPk(id);

        if (!category) {
            return null;
        }

        const updated = await category.update(data);

        return serializeCategory(updated);
    }

    async remove(id) {
        const deleted = await CategorySql.destroy({ where: { id } });

        return deleted ? { id } : null;
    }

    async hasChildren(id) {
        return !!(await CategorySql.findOne({ where: { parentId: id }, attributes: ['id'] }));
    }

    async slugExists(slug, excludeId = null) {
        const where = { slug };
        
        if (excludeId) {
            where.id = { [Op.ne]: excludeId };
        }

        return !!(await CategorySql.findOne({ where, attributes: ['id'] }));
    }

    async hasAncestor(id, candidateId) {
        const all = await CategorySql.findAll({ attributes: ['id', 'parentId'] });
        const flat = all.map(r => ({ id: String(r.id), parentId: r.parentId ? String(r.parentId) : null }));
        
        return isDescendant(flat, String(id), String(candidateId));
    }
}

export function getCategoryRepository() {
    return process.env.DB_TYPE === 'sql' ? new SqlCategoryRepository() : new MongoCategoryRepository();
}