import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { getApp, createFixtures, uniqueEmail, register } from './helpers.js';

let app;
let userAgent;

async function freshUser() {
    const email = uniqueEmail('perfil');
    const res = await register(app, email);
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email, password: 'pass1234' });
    return { agent, userId: res.body.user.id };
}

describe('Perfil de usuario', () => {
    beforeAll(async () => {
        app = await getApp();
        ({ userAgent } = await createFixtures(app));
    });

    it('perfil inexistente responde 404', async () => {
        const { agent } = await freshUser();
        const res = await agent.get('/api/profile');
        expect(res.status).toBe(404);
    });

    it('exige DNI en persona y CUIT+razón social en empresa', async () => {
        const { agent } = await freshUser();

        const noDni = await agent.post('/api/profile').send({
            firstName: 'A', lastName: 'B', phone: '11 1122 3344', isCompany: false
        });
        expect(noDni.status).toBe(400);

        const empresaIncompleta = await agent.post('/api/profile').send({
            firstName: 'A', lastName: 'B', phone: '11 1122 3344', isCompany: true
        });
        expect(empresaIncompleta.status).toBe(400);
    });

    it('crea perfil de persona (con DNI)', async () => {
        const { agent } = await freshUser();

        const create = await agent.post('/api/profile').send({
            firstName: 'Juan', lastName: 'Pérez', phone: '11 5555 1234',
            isCompany: false, dni: '30123456'
        });
        expect(create.status).toBe(201);
        expect(create.body.firstName).toBe('Juan');
        expect(create.body.userId).toBeDefined();
    });

    it('rechaza segundo perfil (409)', async () => {
        const { agent } = await freshUser();

        await agent.post('/api/profile').send({
            firstName: 'Uno', lastName: 'Primero', phone: '11 1111 2222',
            isCompany: false, dni: '30111111'
        });

        const dup = await agent.post('/api/profile').send({
            firstName: 'Otra', lastName: 'Persona', phone: '11 3333 4444',
            isCompany: false, dni: '40111111'
        });
        expect(dup.status).toBe(409);
    });

    it('actualiza el perfil', async () => {
        const { agent } = await freshUser();

        await agent.post('/api/profile').send({
            firstName: 'Maria', lastName: 'Gomez', phone: '11 2222 3333',
            isCompany: false, dni: '30987654'
        });

        const update = await agent.put('/api/profile').send({
            firstName: 'Maria', lastName: 'Gomez', phone: '11 2222 9999',
            isCompany: false, dni: '30987654'
        });
        expect(update.status).toBe(200);
        expect(update.body.phone).toBe('11 2222 9999');

        const get = await agent.get('/api/profile');
        expect(get.status).toBe(200);
        expect(get.body.phone).toBe('11 2222 9999');
    });
});