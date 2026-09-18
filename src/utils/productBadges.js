// Derivaciones de badges de producto (compartidas entre motores)
export function isProductNew(newUntil) {
    if (newUntil === undefined || newUntil === null || newUntil === '') {
        return false;
    }

    const until = new Date(newUntil).getTime();
    if (Number.isNaN(until)) {
        return false;
    }

    return until > Date.now();
}