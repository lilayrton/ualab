import { Op } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Inquiry from '../models/Inquiry.js';
import InquirySql from '../modelsSql/Inquiry.js';
import { serializeInquiry } from '../utils/serializers.js';

const SEARCHABLE_FIELDS = ['name', 'email', 'subject', 'message', 'productName', 'productSku'];

// Escapa caracteres especiales para usar el texto como expresión regular
function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Fechas de los cambios de estado (al volver a pendiente se limpian)
function statusTimestamps(current, status, now) {
    if (status === 'read') {
        return { readAt: current?.readAt ?? now, repliedAt: current?.repliedAt ?? null };
    }

    if (status === 'replied') {
        return { readAt: current?.readAt ?? now, repliedAt: now };
    }

    return { readAt: null, repliedAt: null };
}

class MongoInquiryRepository {
    async getAll({ status, search, productId, page, limit } = {}) {
        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (productId) {
            filter.productId = productId;
        }

        if (search) {
            const regex = new RegExp(escapeRegExp(search), 'i');
            filter.$or = SEARCHABLE_FIELDS.map(field => ({ [field]: regex }));
        }

        const total = await Inquiry.countDocuments(filter);
        const inquiries = await Inquiry.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return { items: inquiries.map(serializeInquiry), total };
    }

    async getById(id) {
        const inquiry = await Inquiry.findById(id);

        return inquiry ? serializeInquiry(inquiry) : null;
    }

    async create(data) {
        const inquiry = await Inquiry.create(data);

        return serializeInquiry(inquiry);
    }

    async setNotified(id, notified) {
        const inquiry = await Inquiry.findByIdAndUpdate(id, { notified }, { new: true });

        return inquiry ? serializeInquiry(inquiry) : null;
    }

    async updateStatus(id, status) {
        const current = await Inquiry.findById(id);
        if (!current) {
            return null;
        }

        const timestamps = statusTimestamps(serializeInquiry(current), status, new Date());
        const inquiry = await Inquiry.findByIdAndUpdate(id, { status, ...timestamps }, { new: true });

        return serializeInquiry(inquiry);
    }

    async remove(id) {
        const deleted = await Inquiry.findByIdAndDelete(id);

        return deleted ? { id } : null;
    }

    async getStats() {
        const now = new Date();
        const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [total, pending, read, replied, last7Days, last30Days, topProducts] = await Promise.all([
            Inquiry.countDocuments(),
            Inquiry.countDocuments({ status: 'pending' }),
            Inquiry.countDocuments({ status: 'read' }),
            Inquiry.countDocuments({ status: 'replied' }),
            Inquiry.countDocuments({ createdAt: { $gte: last7 } }),
            Inquiry.countDocuments({ createdAt: { $gte: last30 } }),
            Inquiry.aggregate([
                { $match: { productId: { $ne: null } } },
                {
                    $group: {
                        _id: { productId: '$productId', productName: '$productName', productSku: '$productSku' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ])
        ]);

        return {
            total,
            pending,
            read,
            replied,
            last7Days,
            last30Days,
            topProducts: topProducts.map(item => ({
                productId: String(item._id.productId),
                productName: item._id.productName ?? '',
                productSku: item._id.productSku ?? '',
                count: item.count
            }))
        };
    }
}

class SqlInquiryRepository {
    async getAll({ status, search, productId, page, limit } = {}) {
        const where = {};

        if (status) {
            where.status = status;
        }

        if (productId) {
            where.productId = productId;
        }

        if (search) {
            where[Op.or] = SEARCHABLE_FIELDS.map(field => ({ [field]: { [Op.like]: `%${search}%` } }));
        }

        const total = await InquirySql.count({ where });
        const inquiries = await InquirySql.findAll({
            where,
            order: [['createdAt', 'DESC']],
            offset: (page - 1) * limit,
            limit
        });

        return { items: inquiries.map(serializeInquiry), total };
    }

    async getById(id) {
        const inquiry = await InquirySql.findByPk(id);

        return inquiry ? serializeInquiry(inquiry) : null;
    }

    async create(data) {
        const inquiry = await InquirySql.create(data);

        return serializeInquiry(inquiry);
    }

    async setNotified(id, notified) {
        const inquiry = await InquirySql.findByPk(id);

        if (!inquiry) {
            return null;
        }

        const updated = await inquiry.update({ notified });

        return serializeInquiry(updated);
    }

    async updateStatus(id, status) {
        const inquiry = await InquirySql.findByPk(id);

        if (!inquiry) {
            return null;
        }

        const timestamps = statusTimestamps(serializeInquiry(inquiry), status, new Date());
        const updated = await inquiry.update({ status, ...timestamps });

        return serializeInquiry(updated);
    }

    async remove(id) {
        const deleted = await InquirySql.destroy({ where: { id } });

        return deleted ? { id } : null;
    }

    async getStats() {
        const now = new Date();
        const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [total, pending, read, replied, last7Days, last30Days, grouped] = await Promise.all([
            InquirySql.count(),
            InquirySql.count({ where: { status: 'pending' } }),
            InquirySql.count({ where: { status: 'read' } }),
            InquirySql.count({ where: { status: 'replied' } }),
            InquirySql.count({ where: { createdAt: { [Op.gte]: last7 } } }),
            InquirySql.count({ where: { createdAt: { [Op.gte]: last30 } } }),
            InquirySql.findAll({
                attributes: [
                    'productId',
                    'productName',
                    'productSku',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'inquiryCount']
                ],
                where: { productId: { [Op.ne]: null } },
                group: ['productId', 'productName', 'productSku'],
                order: [[sequelize.literal('inquiryCount'), 'DESC']],
                limit: 5,
                raw: true
            })
        ]);

        return {
            total,
            pending,
            read,
            replied,
            last7Days,
            last30Days,
            topProducts: grouped.map(item => ({
                productId: item.productId != null ? String(item.productId) : null,
                productName: item.productName ?? '',
                productSku: item.productSku ?? '',
                count: Number(item.inquiryCount)
            }))
        };
    }
}

export function getInquiryRepository() {
    return process.env.DB_TYPE === 'sql' ? new SqlInquiryRepository() : new MongoInquiryRepository();
}
