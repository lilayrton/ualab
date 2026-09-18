import { getProductRepository } from '../repositories/ProductRepository.js';
import { getCategoryRepository } from '../repositories/CategoryRepository.js';
import { getDiscountRepository } from '../repositories/DiscountRepository.js';
import { parseNumber, validateNonNegative } from '../utils/validators.js';

function normalizeImages(images, label = 'Debe proporcionar un arreglo de imágenes') {
    if (!Array.isArray(images)) {
        return { error: label };
    }

    if (images.length > 5) {
        return { error: 'Un producto no puede tener más de 5 imágenes' };
    }

    return { value: images };
}

// Verifica que las categorías existan y devuelve sus ids normalizados
async function normalizeCategories(rawCategories, categoryRepo) {
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

// Cuando se hace update hace que los skus que ya pertenecían al producto sigan asignados
// Una variante sólo puede repetir el SKU de su propio producto, no de otro
async function normalizeVariants(rawVariants, productRepo, { allowedSkuSet = [], productId = null } = {}) {
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

// GET /api/products/public - productos habilitados (sin token)
export async function getPublicProducts(req, res) {
    const products = await getProductRepository().getPublic();

    res.json(products);
}

// GET /api/products - listado de todos los productos
export async function getProducts(req, res) {
    const products = await getProductRepository().getAll();

    res.json(products);
}

// GET /api/products/:id - detalle
export async function getProduct(req, res) {
    const product = await getProductRepository().getById(req.params.id);

    if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(product);
}

// POST /api/products - crear producto
export async function createProduct(req, res) {
    const productRepo = getProductRepository();
    const categoryRepo = getCategoryRepository();
    const discountRepo = getDiscountRepository();

    const {
        name,
        sku,
        images,
        shortDescription,
        longDescription,
        price,
        stock,
        isEnabled,
        categories,
        discountId,
        variants
    } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'El nombre del producto es obligatorio' });
    }

    if (!sku || !sku.trim()) {
        return res.status(400).json({ message: 'El SKU del producto es obligatorio' });
    }

    const finalSku = sku.trim().toUpperCase();

    if (await productRepo.skuExists(finalSku) || await productRepo.variantSkuExists(finalSku)) {
        return res.status(400).json({ message: `El SKU "${finalSku}" ya está en uso` });
    }

    if (images !== undefined) {
        const imagesResult = normalizeImages(images);
        if (imagesResult.error) {
            return res.status(400).json({ message: imagesResult.error });
        }
    }

    const priceResult = parseNumber(price, 'El precio del producto');
    if (priceResult.error) {
        return res.status(400).json({ message: priceResult.error });
    }

    const priceError = validateNonNegative(priceResult.number, 'El precio del producto');
    if (priceError) {
        return res.status(400).json({ message: priceError });
    }

    const stockResult = parseNumber(stock, 'El stock del producto');
    if (stockResult.error) {
        return res.status(400).json({ message: stockResult.error });
    }

    const stockError = validateNonNegative(stockResult.number, 'El stock del producto');
    if (stockError) {
        return res.status(400).json({ message: stockError });
    }

    if (discountId) {
        const discount = await discountRepo.getById(String(discountId));
        if (!discount) {
            return res.status(400).json({ message: 'El descuento indicado no existe' });
        }
    }

    const categoriesResult = await normalizeCategories(categories, categoryRepo);
    if (categoriesResult.error) {
        return res.status(400).json({ message: categoriesResult.error });
    }

    const variantsResult = await normalizeVariants(variants, productRepo);
    if (variantsResult.error) {
        return res.status(400).json({ message: variantsResult.error });
    }

    const product = await productRepo.create(
        {
            name: name.trim(),
            sku: finalSku,
            images: images !== undefined ? images : [],
            shortDescription: shortDescription?.trim() ?? '',
            longDescription: longDescription?.trim() ?? '',
            price: priceResult.number,
            stock: stockResult.number,
            isEnabled: isEnabled ?? true,
            discountId: discountId ? String(discountId) : null
        },
        {
            categories: categoriesResult.value || [],
            variants: variantsResult.value || []
        }
    );

    res.status(201).json(product);
}

// PUT /api/products/:id - actualizar producto (reemplaza categorías y variantes)
export async function updateProduct(req, res) {
    const productRepo = getProductRepository();
    const categoryRepo = getCategoryRepository();
    const discountRepo = getDiscountRepository();

    const existing = await productRepo.getById(req.params.id);
    if (!existing) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const {
        name,
        sku,
        images,
        shortDescription,
        longDescription,
        price,
        stock,
        isEnabled,
        categories,
        discountId,
        variants
    } = req.body;

    const data = {};

    if (name !== undefined) {
        if (!name.trim()) {
            return res.status(400).json({ message: 'El nombre del producto no puede estar vacío' });
        }

        data.name = name.trim();
    }

    if (sku !== undefined) {
        if (!sku.trim()) {
            return res.status(400).json({ message: 'El SKU del producto no puede estar vacío' });
        }

        const finalSku = sku.trim().toUpperCase();

        if (await productRepo.skuExists(finalSku, existing.id) || await productRepo.variantSkuExistsForOtherProduct(finalSku, existing.id)) {
            return res.status(400).json({ message: `El SKU "${finalSku}" ya está en uso` });
        }

        data.sku = finalSku;
    }

    if (images !== undefined) {
        const imagesResult = normalizeImages(images);
        if (imagesResult.error) {
            return res.status(400).json({ message: imagesResult.error });
        }

        data.images = imagesResult.value;
    }

    if (shortDescription !== undefined) {
        data.shortDescription = shortDescription?.trim() ?? '';
    }

    if (longDescription !== undefined) {
        data.longDescription = longDescription?.trim() ?? '';
    }

    if (price !== undefined) {
        const priceResult = parseNumber(price, 'El precio del producto');
        if (priceResult.error) {
            return res.status(400).json({ message: priceResult.error });
        }

        const priceError = validateNonNegative(priceResult.number, 'El precio del producto');
        if (priceError) {
            return res.status(400).json({ message: priceError });
        }

        data.price = priceResult.number;
    }

    if (stock !== undefined) {
        const stockResult = parseNumber(stock, 'El stock del producto');
        if (stockResult.error) {
            return res.status(400).json({ message: stockResult.error });
        }

        const stockError = validateNonNegative(stockResult.number, 'El stock del producto');
        if (stockError) {
            return res.status(400).json({ message: stockError });
        }

        data.stock = stockResult.number;
    }

    if (isEnabled !== undefined) {
        data.isEnabled = Boolean(isEnabled);
    }

    if (discountId !== undefined) {
        if (discountId) {
            const discount = await discountRepo.getById(String(discountId));
            if (!discount) {
                return res.status(400).json({ message: 'El descuento indicado no existe' });
            }

            data.discountId = String(discountId);
        } else {
            data.discountId = null;
        }
    }

    const categoriesResult = await normalizeCategories(categories, categoryRepo);
    if (categoriesResult.error) {
        return res.status(400).json({ message: categoriesResult.error });
    }

    const existingVariants = await productRepo.getVariants(existing.id);
    const allowedSkuSet = existingVariants.map(v => String(v.sku).toUpperCase());

    const variantsResult = await normalizeVariants(variants, productRepo, { allowedSkuSet, productId: existing.id });
    if (variantsResult.error) {
        return res.status(400).json({ message: variantsResult.error });
    }

    const product = await productRepo.update(
        req.params.id,
        data,
        {
            categories: categoriesResult.value,
            variants: variantsResult.value
        }
    );

    res.json(product);
}

// DELETE /api/products/:id - eliminar producto (y sus variantes)
export async function deleteProduct(req, res) {
    const productRepo = getProductRepository();

    const existing = await productRepo.getById(req.params.id);
    if (!existing) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

    await productRepo.remove(existing.id);
    
    res.json({ message: 'Producto eliminado correctamente' });
}