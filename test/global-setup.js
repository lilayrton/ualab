import { unlinkSync } from 'node:fs';
import path from 'node:path';

// Corresponde con DB_STORAGE de test/setup.js
const TEST_DB = 'test-ualab.sqlite';

// Se ejecuta una vez antes de la suite: deja la base limpia para esta corrida
export default function globalSetup() {
    try {
        unlinkSync(path.join(process.cwd(), TEST_DB));
    } catch {
        // Si no existe, no hay nada que limpiar
    }
}