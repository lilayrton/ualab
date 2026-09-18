import { getProductRepository } from '../repositories/ProductRepository.js';
import { getCategoryRepository } from '../repositories/CategoryRepository.js';
import { getDiscountRepository } from '../repositories/DiscountRepository.js';
import { parseNumber, validateNonNegative } from '../utils/validators.js';
import { searchProducts as searchIndex, upsertProduct, removeProduct } from '../services/productSearchService.js';

const SEARCH_SORTS = ['relevance', 'newest', 'priceLow', 'priceHigh', 'name'];
const DEFAULT_SEARCH_LIMIT = 12;
const MAX_SEARCH_LIMIT = 50;

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

    upsertProduct(product).catch(error => console.error('Error al actualizar el índice de búsqueda:', error.message));

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

    upsertProduct(product).catch(error => console.error('Error al actualizar el índice de búsqueda:', error.message));

    res.json(product);
}

function serializeSearchParams(req) {
    const { q, sku, minPrice, maxPrice, inStock, sort, page, limit } = req.query;
    const params = { q: typeof q === 'string' ? q.trim() : '' };

    params.sort = sort ?? 'relevance';
    if (!SEARCH_SORTS.includes(params.sort)) {
        return { error: `El parámetro sort debe ser uno de: ${SEARCH_SORTS.join(', ')}` };
    }

    params.page = page === undefined ? 1 : parseNumber(page, 'El parámetro page').number;
    if (!Number.isInteger(params.page) || params.page < 1) {
        return { error: 'El parámetro page debe ser un entero mayor o igual a 1' };
    }

    params.limit = limit === undefined ? DEFAULT_SEARCH_LIMIT : parseNumber(limit, 'El parámetro limit').number;
    if (!Number.isInteger(params.limit) || params.limit < 1 || params.limit > MAX_SEARCH_LIMIT) {
        return { error: `El parámetro limit debe ser un entero entre 1 y ${MAX_SEARCH_LIMIT}` };
    }

    let minPriceValue = null;

    if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
        const minPriceResult = parseNumber(minPrice, 'El precio mínimo');
        if (minPriceResult.error) {
            return { error: minPriceResult.error };
        }

        minPriceValue = minPriceResult.number;
        const minPriceError = validateNonNegative(minPriceValue, 'El precio mínimo');
        if (minPriceError) {
            return { error: minPriceError };
        }
    }

    params.minPrice = minPriceValue;

    let maxPriceValue = null;

    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
        const maxPriceResult = parseNumber(maxPrice, 'El precio máximo');
        if (maxPriceResult.error) {
            return { error: maxPriceResult.error };
        }

        maxPriceValue = maxPriceResult.number;
        const maxPriceError = validateNonNegative(maxPriceValue, 'El precio máximo');
        if (maxPriceError) {
            return { error: maxPriceError };
        }
    }

    params.maxPrice = maxPriceValue;

    if (minPriceValue !== null && maxPriceValue !== null && minPriceValue > maxPriceValue) {
        return { error: 'El precio mínimo no puede ser mayor al precio máximo' };
    }

    if (inStock !== undefined) {
        if (inStock === 'true') {
            params.onlyInStock = true;
        } else if (inStock === 'false') {
            params.onlyInStock = false;
        } else {
            return { error: 'El parámetro inStock debe ser true o false' };
        }
    }

    if (typeof sku === 'string' && sku.trim()) {
        params.sku = sku.trim().toUpperCase();
    }

    const rawCategories = req.query.categoryId;
    const categoryValues = rawCategories === undefined ? [] : (Array.isArray(rawCategories) ? rawCategories : [rawCategories]);
    params.categoryIds = [...new Set(categoryValues.map(c => String(c)).filter(Boolean))];

    return { value: params };
}

async function runSearch(req, res, { includeDisabled = false } = {}) {
    const productRepo = getProductRepository();
    const result = serializeSearchParams(req);

    if (result.error) {
        return res.status(400).json({ message: result.error });
    }

    const {
        q,
        sort,
        page,
        limit,
        minPrice,
        maxPrice,
        onlyInStock,
        sku,
        categoryIds
    } = result.value;

    let candidateIds = null;

    if (q) {
        candidateIds = await searchIndex(q);
    }

    let candidates = await productRepo.findCandidates(candidateIds);
    candidates = candidates.filter(c => includeDisabled || c.isEnabled);

    if (sku) {
        candidates = candidates.filter(c => c.sku === sku);
    }

    if (minPrice !== null) {
        candidates = candidates.filter(c => c.price >= minPrice);
    }

    if (maxPrice !== null) {
        candidates = candidates.filter(c => c.price <= maxPrice);
    }

    if (onlyInStock === true) {
        candidates = candidates.filter(c => c.stock > 0);
    } else if (onlyInStock === false) {
        candidates = candidates.filter(c => c.stock === 0);
    }

    if (categoryIds.length) {
        candidates = candidates.filter(c => c.categories.some(cat => categoryIds.includes(cat.id)));
    }

    const rankMap = candidateIds ? new Map(candidateIds.map((id, index) => [String(id), index])) : null;
    const byName = (a, b) => String(a.name).localeCompare(String(b.name), 'es');
    const byNewest = (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || byName(a, b);

    candidates.sort((a, b) => {
        switch (sort) {
            case 'priceLow':
                return a.price - b.price || byName(a, b);
            case 'priceHigh':
                return b.price - a.price || byName(a, b);
            case 'name':
                return byName(a, b) || byNewest(a, b);
            case 'newest':
                return byNewest(a, b);
            default: {
                if (rankMap) {
                    return rankMap.get(String(a.id)) - rankMap.get(String(b.id)) || byName(a, b);
                }

                return byNewest(a, b);
            }
        }
    });

    const facetMap = new Map();

    candidates.forEach(c => {
        c.categories.forEach(cat => {
            const entry = facetMap.get(cat.id);

            if (entry) {
                entry.count += 1;
            } else {
                facetMap.set(cat.id, { id: cat.id, name: cat.name, slug: cat.slug, count: 1 });
            }
        });
    });

    const facets = {
        categories: [...facetMap.values()].sort((a, b) => (b.count - a.count) || String(a.name).localeCompare(String(b.name), 'es'))
    };

    const total = candidates.length;
    const pages = total ? Math.ceil(total / limit) : 0;
    const start = (page - 1) * limit;
    const pageCandidates = candidates.slice(start, start + limit);
    const items = pageCandidates.length ? await productRepo.getByIds(pageCandidates.map(c => c.id)) : [];

    res.json({ items, total, page, limit, pages, facets });
}

// GET /api/products/search - búsqueda de vidriera (solo productos habilitados, sin token)
export async function searchProducts(req, res) {
    return runSearch(req, res, { includeDisabled: false });
}

// GET /api/products/search/all - búsqueda de admin (incluye deshabilitados)
export async function searchAdminProducts(req, res) {
    return runSearch(req, res, { includeDisabled: true });
}

// DELETE /api/products/:id - eliminar producto (y sus variantes)
export async function deleteProduct(req, res) {
    const productRepo = getProductRepository();

    const existing = await productRepo.getById(req.params.id);
    if (!existing) {
        return res.status(404).json({ message: 'Producto no encontrado' });
    }

    await productRepo.remove(existing.id);

    removeProduct(existing.id).catch(error => console.error('Error al actualizar el índice de búsqueda:', error.message));
    
    res.json({ message: 'Producto eliminado correctamente' });
}