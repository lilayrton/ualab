import MiniSearch from 'minisearch';
import { getProductRepository } from '../repositories/ProductRepository.js';

let index = null;
let indexBuiltFor = null;
let built = false;
let building = null;

// Tokenizador: minúsculas, sin acentos (NFD) y partido por no alfanuméricos
function tokenizer(text) {
    return String(text ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
}

function buildIndex() {
    return new MiniSearch({
        fields: ['name', 'sku', 'shortDescription', 'longDescription'],
        idField: 'id',
        searchOptions: {
            boost: { name: 3, sku: 3, shortDescription: 1.5, longDescription: 1 },
            fuzzy: 0.2,
            prefix: true
        },
        tokenize: tokenizer
    });
}

function currentDbType() {
    return process.env.DB_TYPE === 'sql' ? 'sql' : 'mongo';
}

// Construye el índice de forma perezosa contra el motor activo (una sola vez por proceso)
async function ensureIndex() {
    if (index && built && indexBuiltFor === currentDbType()) {
        return;
    }

    if (!building) {
        building = (async () => {
            index = buildIndex();
            indexBuiltFor = currentDbType();
            const docs = await getProductRepository().getSearchDocuments();
            index.addAll(docs);
            built = true;
        })().finally(() => {
            building = null;
        });
    }

    await building;
}

// Devuelve los ids rankeados por coincidencia (vacío si el término no matchea nada)
export async function searchProducts(query) {
    await ensureIndex();

    if (!tokenizer(query).length) {
        return [];
    }

    return index.search(query).map(result => String(result.id));
}

export async function upsertProduct(product) {
    await ensureIndex();

    const doc = {
        id: String(product.id),
        name: product.name,
        sku: product.sku,
        shortDescription: product.shortDescription || '',
        longDescription: product.longDescription || ''
    };

    if (index.has(doc.id)) {
        index.discard(doc.id);
    }

    index.add(doc);
}

export async function removeProduct(id) {
    await ensureIndex();

    const normalizedId = String(id);

    if (index.has(normalizedId)) {
        index.discard(normalizedId);
    }
}