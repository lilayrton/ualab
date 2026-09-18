// Validadores compartidos por los controllers (sin librerías externas)

export function parseNumber(value, label) {
    if (value === undefined || value === null || value === '') {
        return { error: `${label} es obligatorio` };
    }

    const number = Number(value);
    if (Number.isNaN(number)) {
        return { error: `${label} debe ser un número` };
    }

    return { number };
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