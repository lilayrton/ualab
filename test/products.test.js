import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { getApp, createFixtures, wait } from './helpers.js';

let app;
let adminAgent;
let userAgent;
let suffix;

async function makeCategory(name) {
    const res = await adminAgent.post('/api/categories').send({ name });
    return res.body.id;
}

describe('Productos y búsqueda', () => {
    beforeAll(async () => {
        app = await getApp();
        ({ adminAgent, userAgent } = await createFixtures(app));
        suffix = Math.random().toString(36).slice(2, 7);
    });

    it('listados públicos y de admin devuelven arreglos serializados', async () => {
        const pub = await request(app).get('/api/products/public');
        expect(pub.status).toBe(200);
        expect(Array.isArray(pub.body)).toBe(true);

        const all = await adminAgent.get('/api/products');
        expect(all.status).toBe(200);
        expect(Array.isArray(all.body)).toBe(true);
    });

    it('crea producto sin imágenes ni extras (defaults correctos)', async () => {
        const res = await adminAgent.post('/api/products').send({
            name: `Base ${suffix}`, sku: `BASE${suffix}`, price: 1000, stock: 5
        });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body._id).toBeUndefined();
        expect(res.body.isEnabled).toBe(true);
        expect(res.body.isFeatured).toBe(false);
        expect(res.body.images).toEqual([]);
    });

    it('exige nombre y SKU', async () => {
        const noName = await adminAgent.post('/api/products').send({ sku: `X${suffix}`, price: 1, stock: 1 });
        expect(noName.status).toBe(400);

        const noSku = await adminAgent.post('/api/products').send({ name: `X ${suffix}`, price: 1, stock: 1 });
        expect(noSku.status).toBe(400);
    });

    it('rechaza SKU duplicado (normalizado a mayúsculas)', async () => {
        await adminAgent.post('/api/products').send({ name: `A ${suffix}`, sku: `SKU-${suffix}`, price: 1, stock: 1 });

        const dup = await adminAgent.post('/api/products').send({ name: `B ${suffix}`, sku: ` sku-${suffix} `, price: 1, stock: 1 });
        expect(dup.status).toBe(400);
    });

    it('valida cantidades y rangos', async () => {
        const sixImages = await adminAgent.post('/api/products').send({
            name: `Imgs ${suffix}`, sku: `IMG${suffix}`, price: 1, stock: 1,
            images: ['a.png', 'b.png', 'c.png', 'd.png', 'e.png', 'f.png']
        });
        expect(sixImages.status).toBe(400);

        const negPrice = await adminAgent.post('/api/products').send({ name: `N ${suffix}`, sku: `NP${suffix}`, price: -1, stock: 1 });
        expect(negPrice.status).toBe(400);

        const badNewUntil = await adminAgent.post('/api/products').send({ name: `N ${suffix}`, sku: `NU${suffix}`, price: 1, stock: 1, newUntil: 'no-es-fecha' });
        expect(badNewUntil.status).toBe(400);

        const badCat = await adminAgent.post('/api/products').send({ name: `N ${suffix}`, sku: `NC${suffix}`, price: 1, stock: 1, categories: ['no-existe'] });
        expect(badCat.status).toBe(400);
    });

    it('acepta 5 imágenes como máximo', async () => {
        const res = await adminAgent.post('/api/products').send({
            name: `Ok ${suffix}`, sku: `OK${suffix}`, price: 1, stock: 1,
            images: ['a.png', 'b.png', 'c.png', 'd.png', 'e.png']
        });
        expect(res.status).toBe(201);
        expect(res.body.images.length).toBe(5);
    });

    it('maneja variantes (y valida sus reglas)', async () => {
        const variants = [
            { name: 'Color Negro', sku: `VARN-${suffix}`, price: 1100, stock: 3 },
            { name: 'Color Blanco', sku: `VARB-${suffix}`, price: 1200, stock: 4 }
        ];

        const res = await adminAgent.post('/api/products').send({
            name: `Con variantes ${suffix}`, sku: `VAR${suffix}`, price: 1000, stock: 0, variants
        });
        expect(res.status).toBe(201);
        expect(res.body.variants.length).toBe(2);

        const sinNombre = await adminAgent.post('/api/products').send({
            name: `Bad ${suffix}`, sku: `VBAD${suffix}`, price: 1, stock: 1,
            variants: [{ sku: `NO-NOMBRE-${suffix}`, price: 1, stock: 1 }]
        });
        expect(sinNombre.status).toBe(400);

        const skuGlobal = await adminAgent.post('/api/products').send({
            name: `Dup ${suffix}`, sku: `VDUP${suffix}`, price: 1, stock: 1,
            variants: [{ name: 'V', sku: `VARB-${suffix}`, price: 1, stock: 1 }]
        });
        expect(skuGlobal.status).toBe(400);
    });

    it('H5: rollback de transacción si una variante rompe una restricción (SQL)', async () => {
        // Llamo al repo directo para saltar las validaciones del controlador
        const { getProductRepository } = await import('../src/repositories/ProductRepository.js');
        const { default: ProductSql } = await import('../src/modelsSql/Product.js');
        const repo = getProductRepository();

        const skuProducto = `TXR${suffix}`;
        const skuVariante = `TXRV1${suffix}`;

        await repo.create(
            { name: `Transaccional ${suffix}`, sku: skuProducto, price: 100, stock: 1 },
            { variants: [{ name: 'V1', sku: skuVariante, price: 100, stock: 1 }] }
        );

        // La variante duplica un SKU existente: el bulkCreate falla y la transacción hace rollback
        await expect(
            repo.create(
                { name: `Transaccional falla ${suffix}`, sku: `TXR-FAIL${suffix}`, price: 100, stock: 1 },
                { variants: [{ name: 'V2', sku: skuVariante, price: 100, stock: 1 }] }
            )
        ).rejects.toThrow();

        // Con rollback el producto no quedó persistido
        const leftover = await ProductSql.findOne({ where: { sku: `TXR-FAIL${suffix}` } });
        expect(leftover).toBeNull();
    });

    it('aplica categorías, descuento y destacado/nuevo al crear', async () => {
        const catId = await makeCategory(`P ${suffix}`);
        const disc = await adminAgent.post('/api/discounts').send({ name: `D ${suffix}`, type: 'amount', value: 100 });

        const res = await adminAgent.post('/api/products').send({
            name: `Estrella ${suffix}`, sku: `EST${suffix}`, price: 2000, stock: 8,
            categories: [catId], discountId: disc.body.id,
            isFeatured: 'true', newUntil: '2027-12-31T00:00:00.000Z'
        });
        expect(res.body.discount.id).toBe(disc.body.id);
        expect(res.body.categories.some(c => c.id === catId)).toBe(true);
        expect(res.body.isFeatured).toBe(true);
        expect(res.body.isNew).toBe(true);
    });

    it('obtiene detalle y actualiza con parseo booleano', async () => {
        const created = await adminAgent.post('/api/products').send({
            name: `Editable ${suffix}`, sku: `EDI${suffix}`, price: 500, stock: 2
        });

        const single = await adminAgent.get(`/api/products/${created.body.id}`);
        expect(single.status).toBe(200);
        expect(single.body.id).toBe(created.body.id);

        const update = await adminAgent.put(`/api/products/${created.body.id}`).send({ isEnabled: 'false' });
        expect(update.status).toBe(200);
        expect(update.body.isEnabled).toBe(false);

        const badBool = await adminAgent.put(`/api/products/${created.body.id}`).send({ isFeatured: 'si' });
        expect(badBool.status).toBe(400);
    });

    it('búsqueda encuentra por nombre (async del índice se refleja)', async () => {
        const name = `Notebook ${suffix}`;
        const res = await adminAgent.post('/api/products').send({ name, sku: `NB${suffix}`, price: 1500, stock: 4 });
        await wait();

        const byName = await request(app).get(`/api/products/search?q=${encodeURIComponent(name)}`);
        expect(byName.body.items.some(i => i.id === res.body.id)).toBe(true);

        const bySku = await request(app).get(`/api/products/search?q=${encodeURIComponent(`NB${suffix}`)}`);
        expect(bySku.body.items.some(i => i.id === res.body.id)).toBe(true);
    });

    it('búsqueda es insensible a acentos y tolera typos (fuzzy)', async () => {
        const tv = await adminAgent.post('/api/products').send({
            name: `Televisión Smart ${suffix}`, sku: `TV${suffix}`, price: 3000, stock: 6
        });
        await wait();

        const sinAcento = await request(app).get(`/api/products/search?q=${encodeURIComponent('television')}`);
        expect(sinAcento.body.items.some(i => i.id === tv.body.id)).toBe(true);

        const typo = await request(app).get(`/api/products/search?q=${encodeURIComponent('televsion')}`);
        expect(typo.body.items.some(i => i.id === tv.body.id)).toBe(true);
    });

    it('filtra por rango de precios y stock', async () => {
        await adminAgent.post('/api/products').send({ name: `Caro ${suffix}`, sku: `CAR${suffix}`, price: 5000, stock: 1 });
        await adminAgent.post('/api/products').send({ name: `Agotado ${suffix}`, sku: `AGO${suffix}`, price: 900, stock: 0 });
        await wait(250);

        const min = await request(app).get('/api/products/search?minPrice=1500');
        expect(min.body.items.every(i => i.price >= 1500)).toBe(true);

        const range = await request(app).get('/api/products/search?minPrice=800&maxPrice=1100');
        expect(range.body.items.every(i => i.price >= 800 && i.price <= 1100)).toBe(true);

        const inStock = await request(app).get('/api/products/search?inStock=true');
        expect(inStock.body.items.every(i => i.stock > 0)).toBe(true);

        const outStock = await request(app).get('/api/products/search?inStock=false');
        expect(outStock.body.items.every(i => i.stock === 0)).toBe(true);
    });

    it('valida parámetros de búsqueda con 400', async () => {
        expect((await request(app).get('/api/products/search?sort=zzz')).status).toBe(400);
        expect((await request(app).get('/api/products/search?limit=0')).status).toBe(400);
        expect((await request(app).get('/api/products/search?page=abc')).status).toBe(400);
        expect((await request(app).get('/api/products/search?minPrice=-5')).status).toBe(400);
        expect((await request(app).get('/api/products/search?inStock=si')).status).toBe(400);
        expect((await request(app).get('/api/products/search?featured=si')).status).toBe(400);
        expect((await request(app).get('/api/products/search?new=si')).status).toBe(400);
        expect((await request(app).get('/api/products/search?minPrice=100&maxPrice=50')).status).toBe(400);
    });

    it('ordena por precio y nombre', async () => {
        const asc = await request(app).get('/api/products/search?sort=priceLow');
        const prices = asc.body.items.map(i => i.price);
        expect([...prices].sort((a, b) => a - b)).toEqual(prices);

        const desc = await request(app).get('/api/products/search?sort=priceHigh');
        const pricesDesc = desc.body.items.map(i => i.price);
        expect([...pricesDesc].sort((a, b) => b - a)).toEqual(pricesDesc);
    });

    it('pagina resultados y filtra por categoría (con facetas)', async () => {
        const catId = await makeCategory(`Facet ${suffix}`);
        await adminAgent.post('/api/products').send({
            name: `Facetado ${suffix}`, sku: `FAC${suffix}`, price: 100, stock: 1, categories: [catId]
        });
        await wait();

        const page1 = await request(app).get('/api/products/search?limit=2&page=1');
        expect(page1.body.items.length).toBe(2);

        const page2 = await request(app).get('/api/products/search?limit=2&page=2');
        expect(page2.body.page).toBe(2);
        expect(page2.body.items.length > 0).toBe(true);

        const byCat = await request(app).get(`/api/products/search?categoryId=${catId}`);
        expect(byCat.body.items.every(i => i.categories.some(c => c.id === catId))).toBe(true);
        const facet = byCat.body.facets.categories.find(c => c.id === catId);
        expect(facet).toBeDefined();
        expect(facet.count > 0).toBe(true);
    });

    it('/featured y /new (públicos) respetan estado y vigencia', async () => {
        const destacado = await adminAgent.post('/api/products').send({
            name: `Destacado ${suffix}`, sku: `DES${suffix}`, price: 100, stock: 1,
            isFeatured: true, newUntil: '2027-12-31T00:00:00.000Z'
        });
        const expirado = await adminAgent.post('/api/products').send({
            name: `Viejo ${suffix}`, sku: `VIE${suffix}`, price: 100, stock: 1,
            isFeatured: true, newUntil: '2020-01-01T00:00:00.000Z'
        });
        const deshabilitado = await adminAgent.post('/api/products').send({
            name: `Oculto ${suffix}`, sku: `OCU${suffix}`, price: 100, stock: 1,
            isFeatured: true, isEnabled: false
        });

        const feat = await request(app).get('/api/products/featured');
        expect(feat.status).toBe(200);
        expect(feat.body.every(p => p.isEnabled === true && p.isFeatured === true)).toBe(true);
        expect(feat.body.some(p => p.id === destacado.body.id)).toBe(true);
        expect(feat.body.some(p => p.id === deshabilitado.body.id)).toBe(false);

        const novedades = await request(app).get('/api/products/new');
        expect(novedades.body.some(p => p.id === destacado.body.id)).toBe(true);
        expect(novedades.body.some(p => p.id === expirado.body.id)).toBe(false);

        const featuredFilter = await request(app).get('/api/products/search?featured=true');
        expect(featuredFilter.body.items.every(p => p.isFeatured === true)).toBe(true);

        const newFilter = await request(app).get('/api/products/search?new=true');
        expect(newFilter.body.items.every(p => p.isNew === true)).toBe(true);
    });

    it('search/all incluye deshabilitados solo para admin', async () => {
        await adminAgent.post('/api/products').send({
            name: `Deshabilitado busca ${suffix}`, sku: `DIS${suffix}`, price: 10, stock: 0, isEnabled: false
        });
        await wait();

        const sinToken = await request(app).get('/api/products/search/all?q=Deshabilitado');
        expect(sinToken.status).toBe(401);

        const pub = await request(app).get('/api/products/search?q=Deshabilitado');
        expect(pub.body.items.some(i => i.name.includes('Deshabilitado'))).toBe(false);

        const admin = await adminAgent.get('/api/products/search/all?q=Deshabilitado');
        expect(admin.body.items.some(i => i.name.includes('Deshabilitado'))).toBe(true);
    });

    it('elimina producto (también del índice de búsqueda)', async () => {
        const name = `Efimero ${suffix}`;
        const res = await adminAgent.post('/api/products').send({ name, sku: `EFI${suffix}`, price: 10, stock: 1 });
        await wait();

        const del = await adminAgent.delete(`/api/products/${res.body.id}`);
        expect(del.status).toBe(200);
        await wait();

        const byName = await request(app).get(`/api/products/search?q=${encodeURIComponent(name)}`);
        expect(byName.body.items.some(i => i.id === res.body.id)).toBe(false);

        const gone = await adminAgent.get(`/api/products/${res.body.id}`);
        expect(gone.status).toBe(404);
    });

    it('ids inválidos devuelven 404 sin romper el flujo', async () => {
        expect((await adminAgent.get('/api/products/no-es-un-id')).status).toBe(404);
        expect((await adminAgent.delete('/api/products/no-es-un-id')).status).toBe(404);

        const health = await request(app).get('/health');
        expect(health.status).toBe(200);
    });

    it('usuario normal recibe 403 en el ABM', async () => {
        const res = await userAgent.post('/api/products').send({ name: 'x', sku: `NX${suffix}`, price: 1, stock: 1 });
        expect(res.status).toBe(403);
    });
});