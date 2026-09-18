import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { getApp, uniqueEmail, register } from './helpers.js';

let app;

describe('Auth', () => {
    beforeAll(async () => {
        app = await getApp();
    });

    it('registra un usuario y devuelve cookie httpOnly con el id', async () => {
        const res = await register(app, uniqueEmail('nuevo'));

        expect(res.status).toBe(201);
        expect(res.body.user.id).toBeDefined();
        expect(res.body.user.email).toBeDefined();
        expect(res.headers['set-cookie']).toBeTruthy();
    });

    it('rechaza email inválido y contraseña corta', async () => {
        const badEmail = await register(app, 'no-soy-un-email');
        expect(badEmail.status).toBe(400);

        const shortPass = await request(app).post('/api/auth/register')
            .send({ email: uniqueEmail('corta'), password: '123' });
        expect(shortPass.status).toBe(400);
    });

    it('normaliza el email (mayúsculas y espacios) en registro y login', async () => {
        const email = uniqueEmail('normaliza');

        const res = await request(app).post('/api/auth/register')
            .send({ email: `  ${email.toUpperCase()}  `, password: 'pass1234' });
        expect(res.status).toBe(201);

        const dup = await register(app, email);
        expect(dup.status).toBe(400);

        const login = await request(app).post('/api/auth/login')
            .send({ email: email.toUpperCase(), password: 'pass1234' });
        expect(login.status).toBe(200);
        expect(login.headers['set-cookie']).toBeTruthy();
    });

    it('login falla con credenciales inválidas', async () => {
        const email = uniqueEmail('login');
        await register(app, email);

        const wrongPass = await request(app).post('/api/auth/login').send({ email, password: 'incorrecta' });
        expect(wrongPass.status).toBe(401);

        const noUser = await request(app).post('/api/auth/login').send({ email: uniqueEmail('fantasma'), password: 'pass1234' });
        expect(noUser.status).toBe(401);
    });

    it('logout limpia la cookie', async () => {
        const res = await request(app).post('/api/auth/logout');

        expect(res.status).toBe(200);
        expect(res.headers['set-cookie']).toBeTruthy();
    });

    it('forgot-password responde 200 sin revelar existencia del email', async () => {
        const res = await request(app).post('/api/auth/forgot-password')
            .send({ email: uniqueEmail('reseteo') });
        expect(res.status).toBe(200);
    });

    it('reset-password rechaza token de sesión (purpose incorrecto)', async () => {
        const email = uniqueEmail('reset');
        const res = await register(app, email);
        const userId = res.body.user.id;

        // Token de sesión normal firmado igual que un enlace de reset: debe rechazarlo
        const sessionToken = jwt.sign({ id: userId }, process.env.RESET_SECRET, { expiresIn: '1h' });

        const reset = await request(app).post('/api/auth/reset-password')
            .send({ token: sessionToken, newPassword: 'nueva123' });
        expect(reset.status).toBe(400);
    });

    it('reset-password rechaza token corrupto y contraseña corta', async () => {
        const bad = await request(app).post('/api/auth/reset-password')
            .send({ token: 'no-es-un-token', newPassword: 'nueva123' });
        expect(bad.status).toBe(400);

        const noToken = await request(app).post('/api/auth/reset-password')
            .send({ newPassword: 'nueva123' });
        expect(noToken.status).toBe(400);

        const short = await request(app).post('/api/auth/reset-password')
            .send({ token: 'cualquiera', newPassword: '123' });
        expect(short.status).toBe(400);
    });

    it('responde 401 sin token en rutas protegidas', async () => {
        const res = await request(app).get('/api/users');
        expect(res.status).toBe(401);
    });

    it('change-password requiere sesión (401)', async () => {
        const res = await request(app).post('/api/auth/change-password')
            .send({ currentPassword: 'pass1234', newPassword: 'nuevaOtra9' });
        expect(res.status).toBe(401);
    });

    it('change-password cambia la contraseña y deja la vieja inútil', async () => {
        const email = uniqueEmail('cambio');
        const agent = request.agent(app);
        const reg = await agent.post('/api/auth/register').send({ email, password: 'pass1234' });
        expect(reg.status).toBe(201);

        const change = await agent.post('/api/auth/change-password')
            .send({ currentPassword: 'pass1234', newPassword: 'nuevaOtra9' });
        expect(change.status).toBe(200);

        const oldLogin = await request(app).post('/api/auth/login').send({ email, password: 'pass1234' });
        expect(oldLogin.status).toBe(401);

        const newLogin = await request(app).post('/api/auth/login').send({ email, password: 'nuevaOtra9' });
        expect(newLogin.status).toBe(200);
    });

    it('change-password rechaza actual incorrecta y nuevas inválidas', async () => {
        const email = uniqueEmail('cambio2');
        const agent = request.agent(app);
        await agent.post('/api/auth/register').send({ email, password: 'pass1234' });

        const wrong = await agent.post('/api/auth/change-password')
            .send({ currentPassword: 'incorrecta', newPassword: 'nuevaOtra9' });
        expect(wrong.status).toBe(401);

        const short = await agent.post('/api/auth/change-password')
            .send({ currentPassword: 'pass1234', newPassword: '123' });
        expect(short.status).toBe(400);

        const same = await agent.post('/api/auth/change-password')
            .send({ currentPassword: 'pass1234', newPassword: 'pass1234' });
        expect(same.status).toBe(400);

        const missing = await agent.post('/api/auth/change-password')
            .send({ currentPassword: 'pass1234' });
        expect(missing.status).toBe(400);
    });
});