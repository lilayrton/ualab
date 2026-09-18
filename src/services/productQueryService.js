import { getProductRepository } from '../repositories/ProductRepository.js';
import { parseNumber, parseBoolean, validateNonNegative } from '../utils/validators.js';
import { isProductNew } from '../utils/productBadges.js';
import { searchProducts as searchIndex } from './productSearchService.js';

const SEARCH_SORTS = ['relevance', 'newest', 'priceLow', 'priceHigh', 'name'];
const DEFAULT_SEARCH_LIMIT = 12;
const MAX_SEARCH_LIMIT = 50;

export function serializeSearchParams(req) {
    const { q, sku, minPrice, maxPrice, inStock, sort, page, limit, featured, 'new': newFilter } = req.query;
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

    const booleanParams = [
        { key: 'inStock', param: 'onlyInStock', label: 'El parámetro inStock' },
        { key: 'featured', param: 'featured', label: 'El parámetro featured' },
        { key: 'new', param: 'newOnly', label: 'El parámetro new' }
    ];

    for (const { key, param, label } of booleanParams) {
        const rawValue = key === 'new' ? newFilter : req.query[key];

        if (rawValue !== undefined) {
            const boolResult = parseBoolean(rawValue, label);
            if (boolResult.error) {
                return { error: boolResult.error };
            }

            params[param] = boolResult.value;
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

// Búsqueda con filtros, orden, facetas y paginación, todo en memoria sobre los candidatos del índice
export async function runSearch(req, res, { includeDisabled = false } = {}) {
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
        categoryIds,
        featured,
        newOnly
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

    if (featured === true) {
        candidates = candidates.filter(c => c.isFeatured);
    } else if (featured === false) {
        candidates = candidates.filter(c => !c.isFeatured);
    }

    if (newOnly === true) {
        candidates = candidates.filter(c => isProductNew(c.newUntil));
    } else if (newOnly === false) {
        candidates = candidates.filter(c => !isProductNew(c.newUntil));
    }

    // Mejora de ranking: si un candidato no está en el índice de relevancia, va al final
    // (evita comparar con undefined → NaN en el sort de relevance)
    const rankMap = candidateIds ? new Map(candidateIds.map((id, index) => [String(id), index])) : null;
    const rankOf = id => (rankMap?.has(String(id)) ? rankMap.get(String(id)) : Number.MAX_SAFE_INTEGER);

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
                    return rankOf(String(a.id)) - rankOf(String(b.id)) || byName(a, b);
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