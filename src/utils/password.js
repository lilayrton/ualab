import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // Hace 2^10 iteraciones de hashing (1024) de forma predeterminada

export function hashPassword(plainPassword) {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export function verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}