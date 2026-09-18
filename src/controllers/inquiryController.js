import { getInquiryRepository } from '../repositories/InquiryRepository.js';
import { getProductRepository } from '../repositories/ProductRepository.js';
import { getStoreInfoRepository } from '../repositories/StoreInfoRepository.js';
import { sendInquiryEmail, sendInquiryConfirmation } from '../utils/mailer.js';
import { isValidId } from '../utils/validators.js';

const STATUSES = ['pending', 'read', 'replied'];
const MAX_LENGTHS = {
    name: 120,
    email: 160,
    phone: 50,
    subject: 160,
    message: 4000
};
const EMAIL_REGEX = /\S+@\S+\.\S+/;

function cleanString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

// Destino del aviso: mail de la tienda, con fallback al .env
function resolveRecipient(storeInfo) {
    return storeInfo.email || process.env.CONTACT_EMAIL || process.env.SMTP_USER || '';
}

// POST /api/inquiries - recibe una consulta del formulario (sin token)
export async function createInquiry(req, res) {
    const name = cleanString(req.body.name);
    const email = cleanString(req.body.email).toLowerCase();
    const phone = cleanString(req.body.phone);
    const subject = cleanString(req.body.subject);
    const message = cleanString(req.body.message);

    if (!name) {
        return res.status(400).json({ message: 'El nombre es obligatorio' });
    }

    if (!email || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ message: 'El email no es válido' });
    }

    if (!message) {
        return res.status(400).json({ message: 'El mensaje es obligatorio' });
    }

    const lengths = { name, email, phone, subject, message };
    for (const field of Object.keys(MAX_LENGTHS)) {
        if (lengths[field].length > MAX_LENGTHS[field]) {
            return res.status(400).json({ message: `El campo ${field} supera el largo máximo permitido` });
        }
    }

    const data = { name, email, phone, subject, message, source: 'contact' };

    if (req.body.productId) {
        const product = await getProductRepository().getById(req.body.productId);
        if (!product) {
            return res.status(400).json({ message: 'El producto indicado no existe' });
        }

        data.source = 'product';
        data.productId = product.id;
        data.productName = product.name;
        data.productSku = product.sku;

        if (req.body.variantId) {
            const variant = product.variants.find(item => item.id === String(req.body.variantId));
            if (!variant) {
                return res.status(400).json({ message: 'La variante indicada no pertenece al producto' });
            }

            data.variantId = variant.id;
            data.variantName = variant.name;
            data.variantSku = variant.sku;
        }
    } else if (req.body.variantId) {
        return res.status(400).json({ message: 'Para indicar una variante debe enviar también el producto' });
    }

    const repository = getInquiryRepository();
    const inquiry = await repository.create(data);

    // El aviso por mail nunca rompe el flujo: si falla, la consulta ya quedó guardada
    const storeInfo = await getStoreInfoRepository().get();
    const recipient = resolveRecipient(storeInfo);
    const notified = await sendInquiryEmail(inquiry, { to: recipient, storeName: storeInfo.name });
    await sendInquiryConfirmation(inquiry, { storeName: storeInfo.name, replyTo: storeInfo.email });

    const saved = notified ? await repository.setNotified(inquiry.id, true) : inquiry;

    res.status(201).json(saved);
}

// GET /api/inquiries - bandeja de entrada con filtros y paginación
export async function getInquiries(req, res) {
    const { status } = req.query;

    if (status !== undefined && !STATUSES.includes(status)) {
        return res.status(400).json({ message: 'El estado debe ser "pending", "read" o "replied"' });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = cleanString(req.query.search);
    const productId = cleanString(req.query.productId);

    const { items, total } = await getInquiryRepository().getAll({
        status,
        search: search || undefined,
        productId: productId || undefined,
        page,
        limit
    });

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
}

// GET /api/inquiries/stats - métricas de la bandeja
export async function getInquiryStats(req, res) {
    const stats = await getInquiryRepository().getStats();

    res.json(stats);
}

// GET /api/inquiries/:id - detalle
export async function getInquiry(req, res) {
    if (!isValidId(req.params.id)) {
        return res.status(404).json({ message: 'Consulta no encontrada' });
    }

    const inquiry = await getInquiryRepository().getById(req.params.id);
    if (!inquiry) {
        return res.status(404).json({ message: 'Consulta no encontrada' });
    }

    res.json(inquiry);
}

// PATCH /api/inquiries/:id/status - marcar como leída, respondida o pendiente
export async function updateInquiryStatus(req, res) {
    if (!isValidId(req.params.id)) {
        return res.status(404).json({ message: 'Consulta no encontrada' });
    }

    const { status } = req.body;

    if (!STATUSES.includes(status)) {
        return res.status(400).json({ message: 'El estado debe ser "pending", "read" o "replied"' });
    }

    const inquiry = await getInquiryRepository().updateStatus(req.params.id, status);
    if (!inquiry) {
        return res.status(404).json({ message: 'Consulta no encontrada' });
    }

    res.json(inquiry);
}

// DELETE /api/inquiries/:id - eliminar consulta
export async function deleteInquiry(req, res) {
    if (!isValidId(req.params.id)) {
        return res.status(404).json({ message: 'Consulta no encontrada' });
    }

    const existing = await getInquiryRepository().getById(req.params.id);
    if (!existing) {
        return res.status(404).json({ message: 'Consulta no encontrada' });
    }

    await getInquiryRepository().remove(req.params.id);

    res.json({ message: 'Consulta eliminada correctamente' });
}
