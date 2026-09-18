import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { getApp, register, uniqueEmail } from './helpers.js';

let app;

describe('CORS y cookie de sesión', () => {
    beforeAll(async () => {
        app = await getApp();
    });

    it('cookie de sesión con SameSite=lax y sin Secure fuera de producción', async () => {
        const res = await register(app, uniqueEmail('cookie'));

        expect(res.status).toBe(201);
        const setCookie = res.headers['set-cookie'][0];
        expect(setCookie).toContain('HttpOnly');
        expect(setCookie).toMatch(/samesite=lax/i);
        expect(setCookie).not.toMatch(/secure/i);
    });

    it('CORS: origen permitido recibe Access-Control-Allow-Origin con credentials', async () => {
        const res = await request(app)
            .get('/health')
            .set('Origin', 'http://localhost:5173');

        expect(res.status).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
        expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('CORS: origen fuera de la allowlist NO recibe Access-Control-Allow-Origin', async () => {
        const res = await request(app)
            .get('/health')
            .set('Origin', 'http://sitio-malicioso.example');

        expect(res.status).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
});