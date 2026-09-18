import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Hace 2^12 iteraciones de hashing (4096) de forma predeterminada

export function hashPassword(plainPassword) {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export function verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}