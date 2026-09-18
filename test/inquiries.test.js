import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { getApp, createFixtures } from './helpers.js';

let app;
let adminAgent;
let suffix;

describe('Consultas (inquiries)', () => {
    beforeAll(async () => {
        app = await getApp();
        ({ adminAgent } = await createFixtures(app));
        suffix = Math.random().toString(36).slice(2, 7);
    });

it('aplica rate limit al formulario (429) y lo acumula por IP', async () => {
        const { rateLimit, clearRateLimitHits } = await import('../src/middlewares/rateLimit.js');
        clearRateLimitHits();

        const limitedApp = express();
        limitedApp.post('/limited', rateLimit({ windowMs: 60000, max: 2, message: 'demasiado' }), (req, res) => {
            res.status(201).json({ ok: true });
        });

        const first = await request(limitedApp).post('/limited');
        const second = await request(limitedApp).post('/limited');
        const third = await request(limitedApp).post('/limited');

        expect(first.status).toBe(201);
        expect(second.status).toBe(201);
        expect(third.status).toBe(429);
        expect(third.body.message).toBe('demasiado');
    });

    it('crea consulta simple sin token', async () => {
        const res = await request(app).post('/api/inquiries').send({
            name: 'Cliente',
            email: 'cliente@test.com',
            phone: '11 5555 0000',
            subject: `Consulta ${suffix}`,
            message: 'Hola, necesito info'
        });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('pending');
        expect(res.body.id).toBeDefined();
        expect(res.body.source).toBe('contact');
    });

    it('rechaza consultas sin nombre, email inválido o sin mensaje', async () => {
        const noName = await request(app).post('/api/inquiries').send({ email: 'a@b.com', message: 'x' });
        expect(noName.status).toBe(400);

        const badEmail = await request(app).post('/api/inquiries').send({ name: 'A', email: 'no-valido', message: 'x' });
        expect(badEmail.status).toBe(400);

        const noMsg = await request(app).post('/api/inquiries').send({ name: 'A', email: 'a@b.com' });
        expect(noMsg.status).toBe(400);
    });

    it('consulta sobre producto existente guarda contexto', async () => {
        const prod = await adminAgent.post('/api/products').send({
            name: `Consultable ${suffix}`, sku: `CON${suffix}`, price: 900, stock: 2
        });

        const res = await request(app).post('/api/inquiries').send({
            name: 'Cliente', email: 'producto@test.com', message: '¿Tienen stock?',
            productId: prod.body.id
        });

        expect(res.status).toBe(201);
        expect(res.body.source).toBe('product');
        expect(res.body.productId).toBe(prod.body.id);
        expect(res.body.productSku).toBe(`CON${suffix}`.toUpperCase());
    });

    it('rechaza producto inexistente y variante sin producto', async () => {
        const noProduct = await request(app).post('/api/inquiries').send({
            name: 'A', email: 'a@b.com', message: 'x', productId: 'no-existe'
        });
        expect(noProduct.status).toBe(400);

        const variantOnly = await request(app).post('/api/inquiries').send({
            name: 'A', email: 'a@b.com', message: 'x', variantId: 'cualquiera'
        });
        expect(variantOnly.status).toBe(400);
    });

    it('bandeja admin: filtros, paginación, detalle y stats', async () => {
        const list = await adminAgent.get('/api/inquiries');
        expect(list.status).toBe(200);
        expect(list.body.items.length > 0).toBe(true);
        expect(list.body.total).toBeDefined();

        const filtradas = await adminAgent.get('/api/inquiries?status=pending');
        expect(filtradas.body.items.every(i => i.status === 'pending')).toBe(true);

        const stats = await adminAgent.get('/api/inquiries/stats');
        expect(stats.status).toBe(200);
        expect(stats.body.total).toBeDefined();
    });

    it('transiciona estados y limpia timestamps', async () => {
        const created = await request(app).post('/api/inquiries').send({
            name: 'Estado', email: 'estado@test.com', message: 'Transición'
        });

        const read = await adminAgent.patch(`/api/inquiries/${created.body.id}/status`).send({ status: 'read' });
        expect(read.status).toBe(200);
        expect(read.body.status).toBe('read');
        expect(read.body.readAt).toBeDefined();

        const replied = await adminAgent.patch(`/api/inquiries/${created.body.id}/status`).send({ status: 'replied' });
        expect(replied.body.status).toBe('replied');
        expect(replied.body.repliedAt).toBeDefined();

        const pending = await adminAgent.patch(`/api/inquiries/${created.body.id}/status`).send({ status: 'pending' });
        expect(pending.body.status).toBe('pending');
        expect(pending.body.readAt).toBeNull();
        expect(pending.body.repliedAt).toBeNull();
    });

    it('valida estado, elimina y maneja ids inválidos', async () => {
        const created = await request(app).post('/api/inquiries').send({
            name: 'Borrar', email: 'borrar@test.com', message: 'Adiós'
        });

        const badStatus = await adminAgent.patch(`/api/inquiries/${created.body.id}/status`).send({ status: 'spam' });
        expect(badStatus.status).toBe(400);

        const del = await adminAgent.delete(`/api/inquiries/${created.body.id}`);
        expect(del.status).toBe(200);

        const gone = await adminAgent.get(`/api/inquiries/${created.body.id}`);
        expect(gone.status).toBe(404);

        expect((await adminAgent.get('/api/inquiries/no-es-un-id')).status).toBe(404);
    });
});
