import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { getApp, createFixtures, uniqueEmail, register } from './helpers.js';

let app;
let adminAgent;
let userAgent;

// Crea un usuario nuevo con su perfil ya cargado y devuelve su agente y su id.
async function userWithProfile(payload) {
    const { agent, userId } = await freshUser();
    const created = await agent.post('/api/profile').send(payload);

    return { agent, userId, created };
}

const persona = {
    firstName: 'Laura',
    lastName: 'Gómez',
    phone: '11 5555 4444',
    isCompany: false,
    dni: '30123456'
};

const empresa = {
    firstName: 'Distribuidora',
    lastName: 'Norte',
    phone: '11 4444 5555',
    isCompany: true,
    cuit: '30-12345678-9',
    companyName: 'Distribuidora Norte SA'
};

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
        ({ adminAgent, userAgent } = await createFixtures(app));
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

    describe('Perfil de otro usuario (solo admin)', () => {
        it('el admin ve el perfil de otro usuario, con el DNI', async () => {
            const { userId } = await userWithProfile(persona);

            const res = await adminAgent.get(`/api/users/${userId}/profile`);

            expect(res.status).toBe(200);
            expect(res.body.dni).toBe('30123456');
            expect(res.body.firstName).toBe('Laura');
            expect(String(res.body.userId)).toBe(String(userId));
        });

        it('el admin ve el CUIT de un perfil de empresa', async () => {
            const { userId } = await userWithProfile(empresa);

            const res = await adminAgent.get(`/api/users/${userId}/profile`);

            expect(res.status).toBe(200);
            expect(res.body.isCompany).toBe(true);
            expect(res.body.cuit).toBe('30-12345678-9');
        });

        it('el admin actualiza el perfil y el dueño ve el cambio', async () => {
            const { agent, userId } = await userWithProfile(persona);

            const update = await adminAgent.put(`/api/users/${userId}/profile`).send({
                ...persona,
                firstName: 'Laura Beatriz',
                dni: '30987654'
            });
            expect(update.status).toBe(200);
            expect(update.body.firstName).toBe('Laura Beatriz');

            // El cambio tiene que estar persistido, no solo devuelto en la respuesta
            const asOwner = await agent.get('/api/profile');
            expect(asOwner.status).toBe(200);
            expect(asOwner.body.firstName).toBe('Laura Beatriz');
            expect(asOwner.body.dni).toBe('30987654');
        });

        it('el admin no crea el perfil si el usuario no lo tiene cargado', async () => {
            const { userId } = await freshUser();

            const res = await adminAgent.put(`/api/users/${userId}/profile`).send(persona);

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/no existe/i);
        });

        it('GET a un usuario sin perfil devuelve 404', async () => {
            const { userId } = await freshUser();

            const res = await adminAgent.get(`/api/users/${userId}/profile`);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Perfil no cargado');
        });

        it('GET a un usuario inexistente devuelve 404', async () => {
            const res = await adminAgent.get('/api/users/999999/profile');

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Usuario no encontrado');
        });

        it('GET con id no numérico devuelve 404 y no explota', async () => {
            const res = await adminAgent.get('/api/users/abc/profile');

            expect(res.status).toBe(404);
        });

        it('un usuario normal no puede ver el perfil de otro (403)', async () => {
            const { agent, userId } = await userWithProfile(persona);

            const res = await agent.get(`/api/users/${userId}/profile`);

            expect(res.status).toBe(403);
        });

        it('sin sesión devuelve 401', async () => {
            const { userId } = await userWithProfile(persona);

            const res = await request(app).get(`/api/users/${userId}/profile`);

            expect(res.status).toBe(401);
        });

        it('el admin no puede editar con un body inválido (400)', async () => {
            const { userId } = await userWithProfile(persona);

            // Empresa sin cuit ni razón social: misma regla que el PUT propio
            const res = await adminAgent.put(`/api/users/${userId}/profile`).send({
                firstName: 'X', lastName: 'Y', phone: '11 1111 1111', isCompany: true
            });

            expect(res.status).toBe(400);
        });

        it('el admin tampoco puede dejar a una persona sin DNI (400)', async () => {
            const { userId } = await userWithProfile(persona);

            const res = await adminAgent.put(`/api/users/${userId}/profile`).send({
                firstName: 'Laura', lastName: 'Gómez', phone: '11 5555 4444', isCompany: false
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/DNI/i);
        });

        it('el admin PUT también normaliza isCompany string', async () => {
            const { userId } = await userWithProfile(persona);

            const res = await adminAgent
                .put(`/api/users/${userId}/profile`)
                .type('form')
                .send({ ...persona, isCompany: 'false', dni: '30555555' });

            expect(res.status).toBe(200);
            expect(res.body.isCompany).toBe(false);
            expect(res.body.dni).toBe('30555555');
        });

        it('el admin PUT con isCompany inválido devuelve 400', async () => {
            const { userId } = await userWithProfile(persona);

            const res = await adminAgent.put(`/api/users/${userId}/profile`).send({
                ...persona, isCompany: 'quiza'
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/true o false/i);
        });

        it('el admin crea el perfil de un usuario que no tiene', async () => {
            const { agent, userId } = await freshUser();

            // El dueño no tiene perfil todavía
            const before = await agent.get('/api/profile');
            expect(before.status).toBe(404);

            const create = await adminAgent.post(`/api/users/${userId}/profile`).send(persona);

            expect(create.status).toBe(201);
            expect(create.body.firstName).toBe('Laura');
            expect(create.body.dni).toBe('30123456');
            expect(String(create.body.userId)).toBe(String(userId));

            // Y el dueño ahora lo ve con su propia sesión
            const after = await agent.get('/api/profile');
            expect(after.status).toBe(200);
            expect(after.body.dni).toBe('30123456');
        });

        it('el admin crea un perfil de empresa sin problema', async () => {
            const { userId } = await freshUser();

            const create = await adminAgent.post(`/api/users/${userId}/profile`).send(empresa);

            expect(create.status).toBe(201);
            expect(create.body.isCompany).toBe(true);
            expect(create.body.cuit).toBe('30-12345678-9');
        });

        it('el admin recibe 409 si el usuario ya tiene perfil', async () => {
            const { userId } = await userWithProfile(persona);

            const res = await adminAgent.post(`/api/users/${userId}/profile`).send(persona);

            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/ya existe/i);
        });

        it('el admin no puede crear el perfil de un usuario inexistente', async () => {
            const res = await adminAgent.post('/api/users/999999/profile').send(persona);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Usuario no encontrado');
        });

        it('el admin no puede crear un perfil inválido (400)', async () => {
            const { userId } = await freshUser();

            // Empresa sin cuit ni razón social
            const res = await adminAgent.post(`/api/users/${userId}/profile`).send({
                firstName: 'X', lastName: 'Y', phone: '11 1111 1111', isCompany: true
            });

            expect(res.status).toBe(400);
        });

        it('el admin no puede crear un perfil de persona sin DNI (400)', async () => {
            const { userId } = await freshUser();

            const res = await adminAgent.post(`/api/users/${userId}/profile`).send({
                firstName: 'Laura', lastName: 'Gómez', phone: '11 5555 4444', isCompany: false
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/DNI/i);
        });

        it('el admin POST también normaliza isCompany string', async () => {
            const { userId } = await freshUser();

            const res = await adminAgent
                .post(`/api/users/${userId}/profile`)
                .type('form')
                .send({ ...persona, isCompany: 'false' });

            expect(res.status).toBe(201);
            expect(res.body.isCompany).toBe(false);
        });

        it('el admin POST con isCompany inválido devuelve 400', async () => {
            const { userId } = await freshUser();

            const res = await adminAgent.post(`/api/users/${userId}/profile`).send({
                ...persona, isCompany: 'quiza'
            });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/true o false/i);
        });

        it('un usuario normal no puede crear el perfil de otro (403)', async () => {
            const { agent, userId } = await freshUser();

            const res = await agent.post(`/api/users/${userId}/profile`).send(persona);

            expect(res.status).toBe(403);
        });

        it('sin sesión no se puede crear el perfil de otro (401)', async () => {
            const { userId } = await freshUser();

            const res = await request(app).post(`/api/users/${userId}/profile`).send(persona);

            expect(res.status).toBe(401);
        });
    });
});