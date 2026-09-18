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