import request from 'supertest';
import { connectDB } from '../src/config/db.js';

let cachedApp = null;

// Conecta la base (una vez para toda la corrida) y expone la instancia de Express
export async function getApp() {
    if (!cachedApp) {
        await connectDB();
        const { default: app } = await import('../src/app.js');
        cachedApp = app;
    }

    return cachedApp;
}

// Espera breve para que el upsert del índice de búsqueda (async) se refleje en /search
export function wait(ms = 150) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function uniqueEmail(prefix) {
    return `${prefix}.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}@test.com`;
}

export async function register(app, email, password = 'pass1234') {
    return request(app).post('/api/auth/register').send({ email, password });
}

// Fuerza el rol admin vía modelo (desacopla del orden de ejecución entre suites)
async function promoteToAdmin(email) {
    if (process.env.DB_TYPE === 'sql') {
        const { default: UserSql } = await import('../src/modelsSql/User.js');
        await UserSql.update({ role: 'admin' }, { where: { email } });
    } else {
        const { default: UserMongo } = await import('../src/models/User.js');
        await UserMongo.findOneAndUpdate({ email }, { $set: { role: 'admin' } }, { new: true });
    }
}

// Crea un usuario admin (+ agente con cookie persistente) y uno user común
export async function createFixtures(app) {
    const adminEmail = uniqueEmail('admin');
    await register(app, adminEmail);
    await promoteToAdmin(adminEmail);

    const adminAgent = request.agent(app);
    const adminLogin = await adminAgent.post('/api/auth/login').send({ email: adminEmail, password: 'pass1234' });
    if (adminLogin.status !== 200) {
        throw new Error('No se pudo autenticar el admin de test');
    }

    const userEmail = uniqueEmail('user');
    const userRes = await register(app, userEmail);
    const userAgent = request.agent(app);
    await userAgent.post('/api/auth/login').send({ email: userEmail, password: 'pass1234' });

    return {
        adminAgent,
        userAgent,
        adminEmail,
        userEmail,
        userId: userRes.body.user.id
    };
}