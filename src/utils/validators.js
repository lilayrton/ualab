// Validadores compartidos por los controllers (sin librerías externas)

export function parseNumber(value, label) {
    if (value === undefined || value === null || value === '') {
        return { error: `${label} es obligatorio` };
    }

    const number = Number(value);
    if (!Number.isFinite(number)) {
        return { error: `${label} debe ser un número válido` };
    }

    return { number };
}

// Acepta booleanos y sus representaciones en string ("true"/"1"/"false"/"0")
export function parseBoolean(value, label) {
    if (value === true || value === 'true' || value === 1 || value === '1') {
        return { value: true };
    }

    if (value === false || value === 'false' || value === 0 || value === '0') {
        return { value: false };
    }

    return { error: `${label} debe ser true o false` };
}

// Valida un id según el motor: ObjectId de 24 hex (Mongo) o entero positivo (SQL)
export function isValidId(id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        return false;
    }

    const value = String(id);

    return /^[0-9a-fA-F]{24}$/.test(value) || /^[1-9]\d*$/.test(value);
}

export function parseDate(value, label) {
    if (value === undefined || value === null || value === '') {
        return { value: null };
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return { error: `${label} debe ser una fecha válida` };
    }

    return { value: date };
}

export function validateNonNegative(number, label) {
    if (number < 0) {
        return `${label} no puede ser negativo`;
    }

    return null;
}