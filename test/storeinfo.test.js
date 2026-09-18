import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { getApp, createFixtures } from './helpers.js';

let app;
let adminAgent;
let userAgent;
let suffix;

const PNG_1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
);
const FAKE_SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

describe('Store info', () => {
    beforeAll(async () => {
        app = await getApp();
        ({ adminAgent, userAgent } = await createFixtures(app));
        suffix = Math.random().toString(36).slice(2, 7);
    });

    it('consulta pública y actualización admin', async () => {
        const pub = await request(app).get('/api/store-info');
        expect(pub.status).toBe(200);
        expect(pub.body.name).toBeDefined();

        const update = await adminAgent.put('/api/store-info').send({
            name: `Tienda ${suffix}`,
            description: 'Tienda de prueba',
            email: 'tienda@test.com'
        });
        expect(update.status).toBe(200);
        expect(update.body.name).toBe(`Tienda ${suffix}`);

        const pub2 = await request(app).get('/api/store-info');
        expect(pub2.body.name).toBe(`Tienda ${suffix}`);
    });

    it('usuario normal no puede modificar', async () => {
        const res = await userAgent.put('/api/store-info').send({ name: 'Hack' });
        expect(res.status).toBe(403);
    });

    it('sube logo válido (png)', async () => {
        const res = await adminAgent.post('/api/store-info/logo')
            .attach('logo', PNG_1x1, 'logo.png');

        expect(res.status).toBe(200);
        expect(res.body.logo).toContain('/uploads/');
    });

    it('rechaza SVG en el logo (400)', async () => {
        const res = await adminAgent.post('/api/store-info/logo')
            .attach('logo', FAKE_SVG, 'logo.svg');

        expect(res.status).toBe(400);
        expect(res.body.message).toBeDefined();
    });
});