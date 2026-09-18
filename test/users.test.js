import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { getApp, createFixtures, uniqueEmail, register } from './helpers.js';

let app;
let adminAgent;
let userAgent;
let adminEmail;

describe('ABM de usuarios (solo admin)', () => {
    beforeAll(async () => {
        app = await getApp();
        ({ adminAgent, userAgent, adminEmail } = await createFixtures(app));
    });

    it('usuario normal recibe 403 en el ABM de usuarios', async () => {
        const res = await userAgent.get('/api/users');
        expect(res.status).toBe(403);
    });

    it('admin crea, lista, actualiza y elimina un usuario', async () => {
        const email = uniqueEmail('creado');

        const create = await adminAgent.post('/api/users').send({ email, password: 'pass1234' });
        expect(create.status).toBe(201);
        expect(create.body.email).toBe(email.toLowerCase());
        const createdId = create.body.id;

        const list = await adminAgent.get('/api/users');
        expect(list.status).toBe(200);
        expect(Array.isArray(list.body)).toBe(true);
        expect(list.body.some(u => u.id === createdId)).toBe(true);

        const update = await adminAgent.put(`/api/users/${createdId}`).send({ email });
        expect(update.status).toBe(200);
        expect(update.body.id).toBe(createdId);

        const single = await adminAgent.get(`/api/users/${createdId}`);
        expect(single.status).toBe(200);
        expect(single.body.id).toBe(createdId);
        expect(single.body._id).toBeUndefined();

        const del = await adminAgent.delete(`/api/users/${createdId}`);
        expect(del.status).toBe(200);

        const gone = await adminAgent.get(`/api/users/${createdId}`);
        expect(gone.status).toBe(404);
    });

    it('valida datos del usuario al crearlo', async () => {
        const badEmail = await adminAgent.post('/api/users').send({ email: 'no-valido', password: 'pass1234' });
        expect(badEmail.status).toBe(400);

        const shortPass = await adminAgent.post('/api/users').send({ email: uniqueEmail('corta'), password: '123' });
        expect(shortPass.status).toBe(400);

        const noEmail = await adminAgent.post('/api/users').send({ password: 'pass1234' });
        expect(noEmail.status).toBe(400);
    });

    it('evita emails duplicados (normalizados)', async () => {
        const email = uniqueEmail('dupe');
        await adminAgent.post('/api/users').send({ email, password: 'pass1234' });

        const dup = await adminAgent.post('/api/users').send({ email: `  ${email.toUpperCase()}  `, password: 'pass1234' });
        expect(dup.status).toBe(400);
    });

    it('no expone contraseñas en el listado', async () => {
        const list = await adminAgent.get('/api/users');
        const serialized = list.body[0];
        expect(serialized.password).toBeUndefined();
        expect(serialized.passwordHash).toBeUndefined();
    });

    it('id inválido responde 404 sin romper el flujo', async () => {
        const res = await adminAgent.get('/api/users/no-es-un-id');
        expect(res.status).toBe(404);

        const del = await adminAgent.delete('/api/users/no-es-un-id');
        expect(del.status).toBe(404);
    });

    it('registro vía /register sigue disponible sin token (no pasó por el ABM)', async () => {
        const res = await register(app, uniqueEmail('independiente'));
        expect(res.status).toBe(201);
    });

    it('admin crea usuario con rol admin y ese usuario queda con privilegios', async () => {
        const email = uniqueEmail('admin2');
        await adminAgent.post('/api/users').send({ email, password: 'pass1234', role: 'admin' });

        const login = await request(app).post('/api/auth/login').send({ email, password: 'pass1234' });
        expect(login.status).toBe(200);

        const agent = request.agent(app);
        await agent.post('/api/auth/login').send({ email, password: 'pass1234' });
        const abm = await agent.get('/api/users');
        expect(abm.status).toBe(200); // 200 (admin) y no 403
    });

    it('rechaza rol inválido al crear', async () => {
        const res = await adminAgent.post('/api/users')
            .send({ email: uniqueEmail('rolmal'), password: 'pass1234', role: 'superuser' });
        expect(res.status).toBe(400);
    });

    it('cambia el rol de un usuario vía PUT', async () => {
        const email = uniqueEmail('promovido');
        const created = await adminAgent.post('/api/users').send({ email, password: 'pass1234' });
        expect(created.body.role).toBe('user');

        const promote = await adminAgent.put(`/api/users/${created.body.id}`).send({ role: 'admin' });
        expect(promote.status).toBe(200);
        expect(promote.body.role).toBe('admin');
    });

    it('el admin puede resetear la contraseña de un usuario', async () => {
        const email = uniqueEmail('reseteado');
        const created = await adminAgent.post('/api/users').send({ email, password: 'pass1234' });

        const change = await adminAgent.put(`/api/users/${created.body.id}`).send({ password: 'nuevaNueva8' });
        expect(change.status).toBe(200);

        const oldLogin = await request(app).post('/api/auth/login').send({ email, password: 'pass1234' });
        expect(oldLogin.status).toBe(401);

        const newLogin = await request(app).post('/api/auth/login').send({ email, password: 'nuevaNueva8' });
        expect(newLogin.status).toBe(200);
    });

    it('valida PUT: rol inválido, contraseña corta y body vacío', async () => {
        const email = uniqueEmail('editable');
        const created = await adminAgent.post('/api/users').send({ email, password: 'pass1234' });
        const id = created.body.id;

        expect((await adminAgent.put(`/api/users/${id}`).send({ role: 'x' })).status).toBe(400);
        expect((await adminAgent.put(`/api/users/${id}`).send({ password: '123' })).status).toBe(400);
        expect((await adminAgent.put(`/api/users/${id}`).send({})).status).toBe(400);
        expect((await adminAgent.put(`/api/users/${id}`).send({ email: 'no-valido' })).status).toBe(400);
    });

    it('un admin no puede quitarse su propio rol', async () => {
        const list = await adminAgent.get('/api/users');
        const admin = list.body.find(u => u.email === adminEmail);
        expect(admin).toBeDefined();

        const demote = await adminAgent.put(`/api/users/${admin.id}`).send({ role: 'user' });
        expect(demote.status).toBe(400);

        // Sigue siendo admin
        const check = await adminAgent.get('/api/users');
        const still = check.body.find(u => u.email === adminEmail);
        expect(still.role).toBe('admin');
    });
});