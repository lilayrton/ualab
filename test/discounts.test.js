import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { getApp, createFixtures } from './helpers.js';

let app;
let adminAgent;
let userAgent;
let suffix;

describe('Descuentos', () => {
    beforeAll(async () => {
        app = await getApp();
        ({ adminAgent, userAgent } = await createFixtures(app));
        suffix = Math.random().toString(36).slice(2, 7);
    });

    it('crea descuentos de tipo amount y percentage', async () => {
        const amount = await adminAgent.post('/api/discounts').send({
            name: `Off ${suffix}`, type: 'amount', value: 500
        });
        expect(amount.status).toBe(201);
        expect(amount.body.id).toBeDefined();
        expect(amount.body._id).toBeUndefined();

        const percent = await adminAgent.post('/api/discounts').send({
            name: `Porc ${suffix}`, type: 'percent', value: 10
        });
        expect(percent.status).toBe(201);
    });

    it('parsea isEnabled como booleano (string "false" no es true)', async () => {
        const create = await adminAgent.post('/api/discounts').send({
            name: `Bool ${suffix}`, type: 'amount', value: 100, isEnabled: 'false'
        });
        expect(create.status).toBe(201);

        const created = await adminAgent.get(`/api/discounts/${create.body.id}`);
        expect(created.body.isEnabled).toBe(false);

        const update = await adminAgent.put(`/api/discounts/${create.body.id}`).send({ isEnabled: true });
        expect(update.status).toBe(200);
        expect(update.body.isEnabled).toBe(true);
    });

    it('valida value y rango de fechas', async () => {
        const noValue = await adminAgent.post('/api/discounts').send({ name: `x ${suffix}`, type: 'amount' });
        expect(noValue.status).toBe(400);

        const neg = await adminAgent.post('/api/discounts').send({ name: `x ${suffix}`, type: 'amount', value: -5 });
        expect(neg.status).toBe(400);

        const badRange = await adminAgent.post('/api/discounts').send({
            name: `x ${suffix}`, type: 'amount', value: 5,
            validFrom: '2026-01-01', validTo: '2025-01-01'
        });
        expect(badRange.status).toBe(400);
    });

    it('type inválido responde 400', async () => {
        const res = await adminAgent.post('/api/discounts').send({ name: `x ${suffix}`, type: 'raro', value: 5 });
        expect(res.status).toBe(400);
    });

    it('la vista pública excluye deshabilitados', async () => {
        const oculto = await adminAgent.post('/api/discounts').send({
            name: `Invisible ${suffix}`, type: 'amount', value: 1, isEnabled: false
        });

        const pub = await request(app).get('/api/discounts/public');
        expect(pub.status).toBe(200);
        expect(pub.body.some(d => d.id === oculto.body.id)).toBe(false);
    });

    it('usuario normal recibe 403 en ABM', async () => {
        const res = await userAgent.post('/api/discounts').send({ name: 'x', type: 'amount', value: 1 });
        expect(res.status).toBe(403);
    });

    it('obtiene detalle, actualiza y elimina', async () => {
        const created = await adminAgent.post('/api/discounts').send({
            name: `Vida ${suffix}`, type: 'amount', value: 50
        });
        const id = created.body.id;

        const single = await adminAgent.get(`/api/discounts/${id}`);
        expect(single.status).toBe(200);
        expect(single.body.id).toBe(id);

        const update = await adminAgent.put(`/api/discounts/${id}`).send({ value: 75 });
        expect(update.status).toBe(200);
        expect(update.body.value).toBe(75);

        const del = await adminAgent.delete(`/api/discounts/${id}`);
        expect(del.status).toBe(200);

        const gone = await adminAgent.get(`/api/discounts/${id}`);
        expect(gone.status).toBe(404);
    });

    it('id inválido responde 404 sin romper el flujo', async () => {
        const res = await adminAgent.get('/api/discounts/no-es-un-id');
        expect(res.status).toBe(404);
    });
});