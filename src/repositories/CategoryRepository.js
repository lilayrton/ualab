import { Op } from 'sequelize';
import Category from '../models/Category.js';
import CategorySql from '../modelsSql/Category.js';
import { buildTree, isDescendant } from '../utils/categoryTree.js';

class MongoCategoryRepository {
    getAll() {
        return Category.find().sort({ sortOrder: 1, name: 1});
    }

    getById(id) {
        return Category.findById(id);
    }

    async getTree({ onlyEnabled = false } = {}) {
        const categories = await Category.find().lean();

        return buildTree(categories, { onlyEnabled });
    }

    create(data) {
        return Category.create(data);
    }

    async remove(id) {
        return Category.findByIdAndDelete(id);
    }

    hasChildren(id) {
        return Category.exists({ parentId: id });
    }

    slugExists(slug, excludeId = null) {
        const filter = { slug };

        if (excludeId) filter._id = { $ne: excludeId };

        return Category.exists(filter);
    }

    async hasAncestor(id, candidateId) {
        const all = await Category.find({}, '_id parentId').lean();
        const flat = all.map(c => ({ id: String(c._id), parentId: c.parentId ? String(c.parentId) : null }));

        return isDescendant(flat, String(id), String(candidateId));
    }
}

class SqlCategoryRepository {
    getAll() {
        return CategorySql.findAll({ order: [['sortOrder', 'ASC'], ['name', 'ASC']] });
    }

    getById(id) {
        return CategorySql.findByPk(id);
    }

    async getTree({ onlyEnabled = false } = {}) {
        const where = onlyEnabled ? { isEnabled: true } : {};
        const categories = await CategorySql.findAll({ where });

        return buildTree(categories, { onlyEnabled });
    }

    create(data) {
        return CategorySql.create(data);
    }

    async update(id, data) {
        const category = await CategorySql.findByPk(id);

        return category ? category.update(data) : null;
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
        
        if (excludeId) where.id = { [Op.ne]: excludeId };

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