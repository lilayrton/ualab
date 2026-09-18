import { getProductRepository } from '../repositories/ProductRepository.js';
import { getCategoryRepository } from '../repositories/CategoryRepository.js';
import { getDiscountRepository } from '../repositories/DiscountRepository.js';
import { parseNumber, parseBoolean, parseDate, validateNonNegative, isValidId } from '../utils/validators.js';
import { normalizeImages, normalizeCategories, normalizeVariants, normalizeDiscountId } from '../utils/productValidation.js';
import { runSearch } from '../services/productQueryService.js';
import { upsertProduct, removeProduct } from '../services/productSearchService.js';

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
    if (!isValidId(req.params.id)) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

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
        isFeatured,
        newUntil,
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

    const imagesResult = images === undefined ? { value: [] } : normalizeImages(images);
    if (imagesResult.error) {
        return res.status(400).json({ message: imagesResult.error });
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

    const newUntilResult = parseDate(newUntil, 'El campo newUntil');
    if (newUntilResult.error) {
        return res.status(400).json({ message: newUntilResult.error });
    }

    const isDisabledResult = isEnabled === undefined ? { value: true } : parseBoolean(isEnabled, 'El campo isEnabled');
    if (isDisabledResult.error) {
        return res.status(400).json({ message: isDisabledResult.error });
    }

    const featuredResult = isFeatured === undefined ? { value: false } : parseBoolean(isFeatured, 'El campo isFeatured');
    if (featuredResult.error) {
        return res.status(400).json({ message: featuredResult.error });
    }

    const discountResult = await normalizeDiscountId(discountId, discountRepo);
    if (discountResult.error) {
        return res.status(400).json({ message: discountResult.error });
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
            images: imagesResult.value,
            shortDescription: shortDescription?.trim() ?? '',
            longDescription: longDescription?.trim() ?? '',
            price: priceResult.number,
            stock: stockResult.number,
            isEnabled: isDisabledResult.value,
            isFeatured: featuredResult.value,
            newUntil: newUntilResult.value,
            discountId: discountResult.value
        },
        {
            categories: categoriesResult.value || [],
            variants: variantsResult.value || []
        }
    );

    upsertProduct(product).catch(error => console.error('Error al actualizar el índice de búsqueda:', error.message));

    res.status(201).json(product);
}

// PUT /api/products/:id - actualizar producto (reemplaza categorías y variantes)
export async function updateProduct(req, res) {
    if (!isValidId(req.params.id)) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

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
        isFeatured,
        newUntil,
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
        const boolResult = parseBoolean(isEnabled, 'El campo isEnabled');
        if (boolResult.error) {
            return res.status(400).json({ message: boolResult.error });
        }

        data.isEnabled = boolResult.value;
    }

    if (isFeatured !== undefined) {
        const boolResult = parseBoolean(isFeatured, 'El campo isFeatured');
        if (boolResult.error) {
            return res.status(400).json({ message: boolResult.error });
        }

        data.isFeatured = boolResult.value;
    }

    if (newUntil !== undefined) {
        const newUntilResult = parseDate(newUntil, 'El campo newUntil');
        if (newUntilResult.error) {
            return res.status(400).json({ message: newUntilResult.error });
        }

        data.newUntil = newUntilResult.value;
    }

    if (discountId !== undefined) {
        const discountResult = await normalizeDiscountId(discountId, discountRepo);
        if (discountResult.error) {
            return res.status(400).json({ message: discountResult.error });
        }

        data.discountId = discountResult.value;
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

    upsertProduct(product).catch(error => console.error('Error al actualizar el índice de búsqueda:', error.message));

    res.json(product);
}

// GET /api/products/search - búsqueda de vidriera (solo productos habilitados, sin token)
export async function searchProducts(req, res) {
    return runSearch(req, res, { includeDisabled: false });
}

// GET /api/products/search/all - búsqueda de admin (incluye deshabilitados)
export async function searchAdminProducts(req, res) {
    return runSearch(req, res, { includeDisabled: true });
}

// GET /api/products/featured - destacados de la vidriera (público)
export async function getFeaturedProducts(req, res) {
    const products = await getProductRepository().getFeatured();

    res.json(products);
}

// GET /api/products/new - novedades de la vidriera (público, newUntil vigente)
export async function getNewProducts(req, res) {
    const products = await getProductRepository().getNewUntil();

    res.json(products);
}

// DELETE /api/products/:id - eliminar producto (y sus variantes)
export async function deleteProduct(req, res) {
    if (!isValidId(req.params.id)) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const productRepo = getProductRepository();

    const existing = await productRepo.getById(req.params.id);
    if (!existing) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

    await productRepo.remove(existing.id);

    removeProduct(existing.id).catch(error => console.error('Error al actualizar el índice de búsqueda:', error.message));

    res.json({ message: 'Producto eliminado correctamente' });
}