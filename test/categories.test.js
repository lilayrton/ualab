import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { getApp, createFixtures, uniqueEmail } from './helpers.js';

let app;
let adminAgent;
let suffix;

describe('Categorías', () => {
    beforeAll(async () => {
        app = await getApp();
        ({ adminAgent } = await createFixtures(app));
        suffix = Math.random().toString(36).slice(2, 7);
    });

    it('crea categorías y devuelve id serializado (sin _id)', async () => {
        const create = await adminAgent.post('/api/categories').send({ name: `Cat ${suffix}` });
        expect(create.status).toBe(201);
        expect(create.body.id).toBeDefined();
        expect(create.body._id).toBeUndefined();
    });

    it('resuelve el slug desde el nombre y evita duplicados', async () => {
        const create = await adminAgent.post('/api/categories').send({ name: `Slug ${suffix}` });
        expect(create.status).toBe(201);
        expect(create.body.slug).toBe(`slug-${suffix}`);

        const dup = await adminAgent.post('/api/categories').send({ name: `Slug ${suffix}` });
        expect(dup.status).toBe(400);
    });

    // Regresión: sortOrder se leía de parseNumber(...).value, pero parseNumber
    // devuelve { number }. El valor se perdía y el defaultValue del modelo (0)
    // lo sobreescribía en silencio, así que cualquier sortOrder daba 0.
    it('guarda el sortOrder enviado al crear', async () => {
        const create = await adminAgent.post('/api/categories')
            .send({ name: `Orden ${suffix}`, sortOrder: 42 });

        expect(create.status).toBe(201);
        expect(create.body.sortOrder).toBe(42);
    });

    it('acepta sortOrder 0 explícito (no lo confunde con ausente)', async () => {
        const create = await adminAgent.post('/api/categories')
            .send({ name: `Orden Cero ${suffix}`, sortOrder: 0 });

        expect(create.status).toBe(201);
        expect(create.body.sortOrder).toBe(0);
    });

    it('sin sortOrder el default es 0', async () => {
        const create = await adminAgent.post('/api/categories').send({ name: `Sin Orden ${suffix}` });

        expect(create.status).toBe(201);
        expect(create.body.sortOrder).toBe(0);
    });

    it('rechaza un sortOrder no numérico con 400', async () => {
        const create = await adminAgent.post('/api/categories')
            .send({ name: `Orden Mal ${suffix}`, sortOrder: 'abc' });

        expect(create.status).toBe(400);
    });

    it('el PUT actualiza el sortOrder', async () => {
        const create = await adminAgent.post('/api/categories')
            .send({ name: `Orden PUT ${suffix}`, sortOrder: 1 });

        const update = await adminAgent.put(`/api/categories/${create.body.id}`)
            .send({ sortOrder: 99 });

        expect(update.status).toBe(200);
        expect(update.body.sortOrder).toBe(99);
    });

    it('ordena el listado por sortOrder ascendente y luego por nombre', async () => {
        // Tres con sortOrder explícito y nombres en orden alfabético inverso,
        // para que un orden por nombre no pueda pasar el test por casualidad.
        const b = await adminAgent.post('/api/categories')
            .send({ name: `Zeta ${suffix}`, sortOrder: 3 });
        const a = await adminAgent.post('/api/categories')
            .send({ name: `Alfa ${suffix}`, sortOrder: 1 });
        const c = await adminAgent.post('/api/categories')
            .send({ name: `Mid ${suffix}`, sortOrder: 2 });

        const list = await adminAgent.get('/api/categories');
        expect(list.status).toBe(200);

        const positions = [a.body.id, c.body.id, b.body.id]
            .map(id => list.body.findIndex(cat => cat.id === id));

        expect(positions).toEqual([...positions].sort((x, y) => x - y));

        // Y el árbol respeta el mismo orden
        const tree = await adminAgent.get('/api/categories/tree');
        const treeOrder = [];
        for (const node of tree.body) {
            if ([a.body.id, c.body.id, b.body.id].includes(node.id)) {
                treeOrder.push(node.id);
            }
            for (const child of node.children || []) {
                if ([a.body.id, c.body.id, b.body.id].includes(child.id)) {
                    treeOrder.push(child.id);
                }
            }
        }
        if (treeOrder.length === 3) {
            expect(treeOrder).toEqual([a.body.id, c.body.id, b.body.id]);
        }
    });

    it('admin lista y obtiene detalle', async () => {
        const list = await adminAgent.get('/api/categories');
        expect(list.status).toBe(200);
        expect(Array.isArray(list.body)).toBe(true);

        const firstId = list.body[0].id;
        const single = await adminAgent.get(`/api/categories/${firstId}`);
        expect(single.status).toBe(200);
        expect(single.body.id).toBe(firstId);
    });

    it('jerarquía: hijo, listado y árbol', async () => {
        const parent = await adminAgent.post('/api/categories').send({ name: `Padre ${suffix}` });
        const child = await adminAgent.post('/api/categories')
            .send({ name: `Hijo ${suffix}`, parentId: parent.body.id });

        expect(child.status).toBe(201);
        expect(child.body.parentId).toBe(parent.body.id);

        const tree = await adminAgent.get('/api/categories/tree');
        expect(tree.status).toBe(200);
        const parentNode = tree.body.find(n => n.id === parent.body.id);
        expect(parentNode).toBeDefined();
        expect(parentNode.children.some(c => c.id === child.body.id)).toBe(true);
    });

    it('no permite asignarse a sí mismo ni a un descendiente', async () => {
        const parent = await adminAgent.post('/api/categories').send({ name: `Ciclo P ${suffix}` });
        const child = await adminAgent.post('/api/categories')
            .send({ name: `Ciclo H ${suffix}`, parentId: parent.body.id });

        const self = await adminAgent.put(`/api/categories/${parent.body.id}`).send({ parentId: parent.body.id });
        expect(self.status).toBe(400);

        const cycle = await adminAgent.put(`/api/categories/${parent.body.id}`).send({ parentId: child.body.id });
        expect(cycle.status).toBe(400);
    });

    it('actualiza nombre y estado con parseo booleano', async () => {
        const cat = await adminAgent.post('/api/categories').send({ name: `Estado ${suffix}`, isEnabled: 'false' });

        expect(cat.body.isEnabled).toBe(false);

        const update = await adminAgent.put(`/api/categories/${cat.body.id}`).send({ name: `Estado ${suffix} renombrada`, isEnabled: true });
        expect(update.status).toBe(200);
        expect(update.body.name).toBe(`Estado ${suffix} renombrada`);
        expect(update.body.isEnabled).toBe(true);

        const badBool = await adminAgent.put(`/api/categories/${cat.body.id}`).send({ isEnabled: 'si' });
        expect(badBool.status).toBe(400);
    });

    it('la vista pública solo muestra habilitadas', async () => {
        const deshabilitada = await adminAgent.post('/api/categories').send({ name: `Oculta ${suffix}`, isEnabled: false });

        const pub = await request(app).get('/api/categories/public');
        expect(pub.status).toBe(200);
        expect(pub.body.some(c => c.id === deshabilitada.body.id)).toBe(false);
    });

    it('no elimina categorías con hijas (409)', async () => {
        const parent = await adminAgent.post('/api/categories').send({ name: `Hijas ${suffix}` });
        await adminAgent.post('/api/categories').send({ name: `Hija ${suffix}`, parentId: parent.body.id });

        const del = await adminAgent.delete(`/api/categories/${parent.body.id}`);
        expect(del.status).toBe(409);
    });

    it('elimina categoría sin hijas y responde 404 a ids inválidos', async () => {
        const cat = await adminAgent.post('/api/categories').send({ name: `Borrar ${suffix}` });

        const del = await adminAgent.delete(`/api/categories/${cat.body.id}`);
        expect(del.status).toBe(200);

        const invalid = await adminAgent.get('/api/categories/no-es-un-id');
        expect(invalid.status).toBe(404);
    });
});