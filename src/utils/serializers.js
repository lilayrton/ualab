// Serializadores compartidos: garantizan el MISMO shape de respuesta (DTO) para ambos motores (Mongo + SQL)
import { isProductNew } from './productBadges.js';

function toJson(raw) {
    return raw && typeof raw.toJSON === 'function' ? raw.toJSON() : raw;
}

function stringId(raw) {
    return String(raw._id ?? raw.id);
}

// Categoría completa (obtener/crear/actualizar categorías y árboles)
export function serializeCategory(category) {
    const raw = toJson(category);

    return {
        id: stringId(raw),
        name: raw.name,
        description: raw.description ?? '',
        slug: raw.slug,
        isEnabled: raw.isEnabled,
        sortOrder: raw.sortOrder ?? 0,
        parentId: raw.parentId ? String(raw.parentId) : null,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt
    };
}

// Categoría breve (anidada en productos)
export function serializeCategoryBrief(category) {
    const raw = toJson(category);

    return {
        id: stringId(raw),
        name: raw.name,
        slug: raw.slug
    };
}

// Descuento completo (listados, detalle, creación y update de descuentos)
export function serializeDiscount(discount) {
    const raw = toJson(discount);

    return {
        id: stringId(raw),
        name: raw.name,
        type: raw.type,
        value: Number(raw.value),
        isEnabled: raw.isEnabled,
        validFrom: raw.validFrom,
        validTo: raw.validTo,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt
    };
}

// Descuento breve (anidado en productos)
export function serializeDiscountBrief(discount) {
    const raw = toJson(discount);

    return {
        id: stringId(raw),
        name: raw.name,
        type: raw.type,
        value: Number(raw.value)
    };
}

export function serializeVariant(variant) {
    const raw = toJson(variant);

    return {
        id: stringId(raw),
        name: raw.name,
        sku: raw.sku,
        price: Number(raw.price),
        stock: raw.stock
    };
}

// Producto completo con variantes + descuento inyectados (Mongo los resuelve aparte, SQL vía include)
export function serializeProduct(product, { variants = [], discount = null } = {}) {
    const raw = toJson(product);

    return {
        id: stringId(raw),
        name: raw.name,
        sku: raw.sku,
        images: raw.images || [],
        shortDescription: raw.shortDescription || '',
        longDescription: raw.longDescription || '',
        price: Number(raw.price),
        stock: raw.stock,
        isEnabled: raw.isEnabled,
        isFeatured: raw.isFeatured === true,
        isNew: isProductNew(raw.newUntil),
        categories: (raw.categories || []).map(serializeCategoryBrief),
        discount: discount ? serializeDiscountBrief(discount) : null,
        variants: variants.map(serializeVariant),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt
    };
}

// Candidato mínimo (busqueda) con categorías para filtros, facetas y orden en memoria
export function serializeProductCandidate(raw) {
    return {
        id: stringId(raw),
        name: raw.name,
        sku: raw.sku,
        price: Number(raw.price),
        stock: raw.stock,
        isEnabled: raw.isEnabled,
        isFeatured: raw.isFeatured === true,
        newUntil: raw.newUntil || null,
        createdAt: raw.createdAt,
        categories: (raw.categories || []).map(serializeCategoryBrief)
    };
}

export function serializeInquiry(inquiry) {
    const raw = toJson(inquiry);

    return {
        id: stringId(raw),
        name: raw.name,
        email: raw.email,
        phone: raw.phone ?? '',
        subject: raw.subject ?? '',
        message: raw.message,
        source: raw.source,
        productId: raw.productId ? String(raw.productId) : null,
        productName: raw.productName ?? '',
        productSku: raw.productSku ?? '',
        variantId: raw.variantId ? String(raw.variantId) : null,
        variantName: raw.variantName ?? '',
        variantSku: raw.variantSku ?? '',
        status: raw.status,
        notified: raw.notified,
        readAt: raw.readAt ?? null,
        repliedAt: raw.repliedAt ?? null,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt
    };
}

// Sirve tanto para documentos Mongo como para filas SQL
export function serializeStoreInfo(record) {
    const raw = toJson(record);
    const social = raw.social || {};

    return {
        id: stringId(raw),
        name: raw.name ?? '',
        description: raw.description ?? '',
        address: raw.address ?? '',
        phone: raw.phone ?? '',
        email: raw.email ?? '',
        whatsapp: raw.whatsapp ?? '',
        logo: raw.logo ?? '',
        hours: raw.hours ?? '',
        social: {
            facebook: social.facebook ?? raw.facebook ?? '',
            instagram: social.instagram ?? raw.instagram ?? '',
            twitter: social.twitter ?? raw.twitter ?? '',
            linkedin: social.linkedin ?? raw.linkedin ?? ''
        },
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt
    };
}

export function serializeUser(user) {
    const raw = toJson(user);

    return {
        id: stringId(raw),
        email: raw.email,
        role: raw.role,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt
    };
}

// El perfil usa userId como nombre de campo en ambos motores (Mongo: user → userId)
export function serializeProfile(profile) {
    const raw = toJson(profile);
    const userIdValue = raw.userId ?? raw.user;

    return {
        id: stringId(raw),
        userId: userIdValue ? String(userIdValue) : null,
        firstName: raw.firstName,
        lastName: raw.lastName,
        phone: raw.phone,
        isCompany: raw.isCompany,
        dni: raw.dni ?? '',
        cuit: raw.cuit ?? '',
        companyName: raw.companyName ?? '',
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt
    };
}