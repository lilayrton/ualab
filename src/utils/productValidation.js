// Validaciones y normalizaciones de productos (compartidas por create y update)
import { parseNumber, validateNonNegative } from './validators.js';

export function normalizeImages(images, label = 'Debe proporcionar un arreglo de imágenes') {
    if (!Array.isArray(images)) {
        return { error: label };
    }

    if (images.length > 5) {
        return { error: 'Un producto no puede tener más de 5 imágenes' };
    }

    return { value: images };
}

// Verifica que las categorías existan y devuelve sus ids normalizados
export async function normalizeCategories(rawCategories, categoryRepo) {
    if (rawCategories === undefined) {
        return { value: undefined };
    }

    if (!Array.isArray(rawCategories)) {
        return { error: 'Las categorías deben ser un arreglo' };
    }

    const ids = [...new Set(rawCategories.map(c => String(c)))];

    if (ids.length) {
        const found = await categoryRepo.getByIds(ids);

        if (found.length !== ids.length) {
            return { error: 'Alguna de las categorías indicadas no existe' };
        }
    }

    return { value: ids };
}

// Verifica que el descuento exista y devuelve su id normalizado (o null si se limpia)
export async function normalizeDiscountId(rawDiscountId, discountRepo) {
    if (rawDiscountId === undefined || rawDiscountId === null || rawDiscountId === '') {
        return { value: null };
    }

    const id = String(rawDiscountId);
    const discount = await discountRepo.getById(id);

    if (!discount) {
        return { error: 'El descuento indicado no existe' };
    }

    return { value: id };
}

// Cuando se hace update hace que los skus que ya pertenecían al producto sigan asignados
// Una variante sólo puede repetir el SKU de su propio producto, no de otro
export async function normalizeVariants(rawVariants, productRepo, { allowedSkuSet = [], productId = null } = {}) {
    if (rawVariants === undefined) {
        return { value: undefined };
    }

    if (!Array.isArray(rawVariants)) {
        return { error: 'Las variantes deben ser un arreglo' };
    }

    const variants = [];
    const seenSkus = new Set();

    for (const raw of rawVariants) {
        const name = raw?.name;
        if (!name || !name.trim()) {
            return { error: 'El nombre de cada variante es obligatorio' };
        }

        const sku = raw?.sku;
        if (!sku || !sku.trim()) {
            return { error: 'El SKU de cada variante es obligatorio' };
        }

        const finalSku = sku.trim().toUpperCase();
        if (seenSkus.has(finalSku)) {
            return { error: `El SKU "${finalSku}" está duplicado entre las variantes` };
        }

        const priceResult = parseNumber(raw.price, `El precio de la variante "${name}"`);
        if (priceResult.error) {
            return { error: priceResult.error };
        }

        const priceError = validateNonNegative(priceResult.number, `El precio de la variante "${name}"`);
        if (priceError) {
            return { error: priceError };
        }

        const stockResult = parseNumber(raw.stock, `El stock de la variante "${name}"`);
        if (stockResult.error) {
            return { error: stockResult.error };
        }

        const stockError = validateNonNegative(stockResult.number, `El stock de la variante "${name}"`);
        if (stockError) {
            return { error: stockError };
        }

        if (!allowedSkuSet.includes(finalSku) && await productRepo.variantSkuExists(finalSku)) {
            return { error: `El SKU "${finalSku}" ya está en uso` };
        }

        if (await productRepo.skuExists(finalSku, productId)) {
            return { error: `El SKU "${finalSku}" ya está en uso` };
        }

        seenSkus.add(finalSku);
        variants.push({
            name: name.trim(),
            sku: finalSku,
            price: priceResult.number,
            stock: stockResult.number
        });
    }

    return { value: variants };
}