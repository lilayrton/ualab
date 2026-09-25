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

    // Matriz de isCompany: el bug era que "false" (string, p.ej. form-urlencoded)
    // es truthy en JS y disparaba la validación de empresa.
    describe('combinaciones de isCompany', () => {
        const base = { firstName: 'Test', lastName: 'Combo', phone: '11 0000 1111' };

        it('acepta isCompany booleano false (persona) sin cuit ni razón social', async () => {
            const { agent } = await freshUser();

            const res = await agent.post('/api/profile').send({
                ...base, isCompany: false, dni: '31234567'
            });
            expect(res.status).toBe(201);
            expect(res.body.isCompany).toBe(false);
            expect(res.body.dni).toBe('31234567');
        });

        it.each([
            ['string "false"', 'false'],
            ['string "0"', '0'],
            ['número 0', 0]
        ])('trata %s como persona (no pide cuit)', async (_label, isCompany) => {
            const { agent } = await freshUser();

            const res = await agent.post('/api/profile').send({
                ...base, isCompany, dni: '31234567'
            });
            expect(res.status).toBe(201);
            expect(res.body.isCompany).toBe(false);
        });

        it('funciona con body form-urlencoded (el caso que fallaba)', async () => {
            const { agent } = await freshUser();

            const res = await agent
                .post('/api/profile')
                .type('form')
                .send({ ...base, isCompany: 'false', dni: '31234567' });
            expect(res.status).toBe(201);
            expect(res.body.isCompany).toBe(false);
        });

        it('sin isCompany asume persona y exige dni', async () => {
            const { agent } = await freshUser();

            const sinDni = await agent.post('/api/profile').send({ ...base });
            expect(sinDni.status).toBe(400);
            expect(sinDni.body.message).toMatch(/DNI/i);

            const { agent: agent2 } = await freshUser();
            const conDni = await agent2.post('/api/profile').send({ ...base, dni: '31234567' });
            expect(conDni.status).toBe(201);
            expect(conDni.body.isCompany).toBe(false);
        });

        it('persona con dni vacío (string) se rechaza', async () => {
            const { agent } = await freshUser();

            const res = await agent.post('/api/profile').send({
                ...base, isCompany: false, dni: ''
            });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/DNI/i);
        });

        it.each([
            ['booleano true', true],
            ['string "true"', 'true'],
            ['string "1"', '1'],
            ['número 1', 1]
        ])('trata %s como empresa y exige cuit + razón social', async (_label, isCompany) => {
            const { agent } = await freshUser();

            const incompleto = await agent.post('/api/profile').send({ ...base, isCompany });
            expect(incompleto.status).toBe(400);
            expect(incompleto.body.message).toMatch(/CUIT|raz/i);
        });

        it('empresa completa con string "true" se crea bien', async () => {
            const { agent } = await freshUser();

            const res = await agent.post('/api/profile').send({
                ...base, isCompany: 'true', cuit: '30123456789', companyName: 'UALab S.A.'
            });
            expect(res.status).toBe(201);
            expect(res.body.isCompany).toBe(true);
            expect(res.body.cuit).toBe('30123456789');
            expect(res.body.companyName).toBe('UALab S.A.');
        });

        it('empresa sin companyName se rechaza', async () => {
            const { agent } = await freshUser();

            const res = await agent.post('/api/profile').send({
                ...base, isCompany: true, cuit: '30123456789'
            });
            expect(res.status).toBe(400);
        });

        it('rechaza isCompany inválido con mensaje claro', async () => {
            const { agent } = await freshUser();

            const res = await agent.post('/api/profile').send({
                ...base, isCompany: 'quiza', dni: '31234567'
            });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/true o false/i);
        });

        it('PUT también normaliza isCompany string', async () => {
            const { agent } = await freshUser();

            await agent.post('/api/profile').send({
                ...base, isCompany: false, dni: '31234567'
            });

            const update = await agent.put('/api/profile').type('form').send({
                ...base, isCompany: 'false', dni: '31987654'
            });
            expect(update.status).toBe(200);
            expect(update.body.isCompany).toBe(false);
            expect(update.body.dni).toBe('31987654');
        });

        it('PUT con isCompany inválido devuelve 400', async () => {
            const { agent } = await freshUser();

            await agent.post('/api/profile').send({
                ...base, isCompany: false, dni: '31234567'
            });

            const update = await agent.put('/api/profile').send({
                ...base, isCompany: 'nope', dni: '31234567'
            });
            expect(update.status).toBe(400);
            expect(update.body.message).toMatch(/true o false/i);
        });
    });
});