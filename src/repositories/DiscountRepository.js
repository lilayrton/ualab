import { Op } from 'sequelize';
import Discount from '../models/Discount.js';
import DiscountSql from '../modelsSql/Discount.js';
import { serializeDiscount } from '../utils/serializers.js';

class MongoDiscountRepository {
    async getAll() {
        const discounts = await Discount.find().sort({ name: 1 });

        return discounts.map(serializeDiscount);
    }

    // Descuentos habilitados y dentro de su ventana de vigencia
    async getEnabled() {
        const now = new Date();
        const discounts = await Discount.find({
            isEnabled: true,
            $and: [
                { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
                { $or: [{ validTo: null }, { validTo: { $gte: now } }] }
            ]
        }).sort({ name: 1 });

        return discounts.map(serializeDiscount);
    }

    async getById(id) {
        const discount = await Discount.findById(id);

        return discount ? serializeDiscount(discount) : null;
    }

    create(data) {
        return Discount.create(data);
    }

    async update(id, data) {
        const discount = await Discount.findByIdAndUpdate(id, data, { new: true, runValidators: true });

        return discount ? serializeDiscount(discount) : null;
    }

    async remove(id) {
        const deleted = await Discount.findByIdAndDelete(id);

        return deleted ? { id } : null;
    }
}

class SqlDiscountRepository {
    async getAll() {
        const discounts = await DiscountSql.findAll({ order: [['name', 'ASC']] });

        return discounts.map(serializeDiscount);
    }

    // Descuentos habilitados y dentro de su ventana de vigencia
    async getEnabled() {
        const now = new Date();
        const discounts = await DiscountSql.findAll({
            where: {
                isEnabled: true,
                [Op.and]: [
                    { validFrom: { [Op.or]: [null, { [Op.lte]: now }] } },
                    { validTo: { [Op.or]: [null, { [Op.gte]: now }] } }
                ]
            },
            order: [['name', 'ASC']]
        });

        return discounts.map(serializeDiscount);
    }

    async getById(id) {
        const discount = await DiscountSql.findByPk(id);

        return discount ? serializeDiscount(discount) : null;
    }

    create(data) {
        return DiscountSql.create(data);
    }

    async update(id, data) {
        const discount = await DiscountSql.findByPk(id);

        if (!discount) {
            return null;
        }

        const updated = await discount.update(data);

        return serializeDiscount(updated);
    }

    async remove(id) {
        const deleted = await DiscountSql.destroy({ where: { id } });

        return deleted ? { id } : null;
    }
}

export function getDiscountRepository() {
    return process.env.DB_TYPE === 'sql' ? new SqlDiscountRepository() : new MongoDiscountRepository();
}