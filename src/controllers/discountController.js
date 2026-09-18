import { getDiscountRepository } from '../repositories/DiscountRepository.js';
import { getProductRepository } from '../repositories/ProductRepository.js';
import { parseNumber, parseBoolean, parseDate, validateNonNegative, isValidId } from '../utils/validators.js';

function validateDiscountValue(value, type) {
    if (type === 'percent' && (value < 1 || value > 100)) {
        return 'El valor de un descuento porcentual debe estar entre 1 y 100';
    }

    if (type === 'amount' && value < 0) {
        return 'El valor de un descuento en monto no puede ser negativo';
    }

    return null;
}

// GET /api/discounts/public - descuentos habilitados y vigentes (sin token)
export async function getPublicDiscounts(req, res) {
    const discounts = await getDiscountRepository().getEnabled();

    res.json(discounts);
}

// GET /api/discounts - listado de todos los descuentos
export async function getDiscounts(req, res) {
    const discounts = await getDiscountRepository().getAll();

    res.json(discounts);
}

// GET /api/discounts/:id - detalle
export async function getDiscount(req, res) {
    if (!isValidId(req.params.id)) {
        return res.status(404).json({ message: 'Descuento no encontrado' });
    }

    const discount = await getDiscountRepository().getById(req.params.id);

    if (!discount) {
        return res.status(404).json({ message: 'Descuento no encontrado' });
    }

    res.json(discount);
}

// POST /api/discounts - crear descuento
export async function createDiscount(req, res) {
    const { name, type, value, isEnabled, validFrom, validTo } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'El nombre del descuento es obligatorio' });
    }

    if (type !== 'amount' && type !== 'percent') {
        return res.status(400).json({ message: 'El tipo de descuento debe ser "amount" o "percent"' });
    }

    const valueResult = parseNumber(value, 'El valor del descuento');
    if (valueResult.error) {
        return res.status(400).json({ message: valueResult.error });
    }

    const valueError = validateDiscountValue(valueResult.number, type);
    if (valueError) {
        return res.status(400).json({ message: valueError });
    }

    const fromResult = parseDate(validFrom, 'validFrom');
    const toResult = parseDate(validTo, 'validTo');

    if (fromResult.error) {
        return res.status(400).json({ message: fromResult.error });
    }

    if (toResult.error) {
        return res.status(400).json({ message: toResult.error });
    }

    if (fromResult.value && toResult.value && fromResult.value > toResult.value) {
        return res.status(400).json({ message: 'validFrom no puede ser posterior a validTo' });
    }

    const enabledResult = isEnabled === undefined ? { value: true } : parseBoolean(isEnabled, 'El campo isEnabled');
    if (enabledResult.error) {
        return res.status(400).json({ message: enabledResult.error });
    }

    const discount = await getDiscountRepository().create({
        name: name.trim(),
        type,
        value: valueResult.number,
        isEnabled: enabledResult.value,
        validFrom: fromResult.value,
        validTo: toResult.value
    });

    res.status(201).json({ id: String(discount._id || discount.id) });
}

// PUT /api/discounts/:id - actualizar descuento
export async function updateDiscount(req, res) {
    if (!isValidId(req.params.id)) {
        return res.status(404).json({ message: 'Descuento no encontrado' });
    }

    const discountRepo = getDiscountRepository();

    const existing = await discountRepo.getById(req.params.id);
    if (!existing) {
        return res.status(404).json({ message: 'Descuento no encontrado' });
    }

    const { name, type, value, isEnabled, validFrom, validTo } = req.body;
    const data = {};

    if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'El nombre del descuento no puede estar vacío' });
        }

        data.name = name.trim();
    }

    let effectiveType = existing.type;

    if (type !== undefined) {
        if (type !== 'amount' && type !== 'percent') {
            return res.status(400).json({ message: 'El tipo de descuento debe ser "amount" o "percent"' });
        }

        data.type = type;
        effectiveType = type;
    }

    if (value !== undefined) {
        const valueResult = parseNumber(value, 'El valor del descuento');
        if (valueResult.error) {
            return res.status(400).json({ message: valueResult.error });
        }

        const valueError = validateDiscountValue(valueResult.number, effectiveType);
        if (valueError) {
            return res.status(400).json({ message: valueError });
        }

        data.value = valueResult.number;
    }

    if (isEnabled !== undefined) {
        const boolResult = parseBoolean(isEnabled, 'El campo isEnabled');
        if (boolResult.error) {
            return res.status(400).json({ message: boolResult.error });
        }

        data.isEnabled = boolResult.value;
    }

    let fromValue = existing.validFrom;
    let toValue = existing.validTo;

    if (validFrom !== undefined) {
        const fromResult = parseDate(validFrom, 'validFrom');
        if (fromResult.error) {
            return res.status(400).json({ message: fromResult.error });
        }

        data.validFrom = fromResult.value;
        fromValue = fromResult.value;
    }

    if (validTo !== undefined) {
        const toResult = parseDate(validTo, 'validTo');
        if (toResult.error) {
            return res.status(400).json({ message: toResult.error });
        }

        data.validTo = toResult.value;
        toValue = toResult.value;
    }

    if (fromValue && toValue && fromValue > toValue) {
        return res.status(400).json({ message: 'validFrom no puede ser posterior a validTo' });
    }

    const discount = await discountRepo.update(req.params.id, data);

    res.json(discount);
}

// DELETE /api/discounts/:id - eliminar descuento
export async function deleteDiscount(req, res) {
    if (!isValidId(req.params.id)) {
        return res.status(404).json({ message: 'Descuento no encontrado' });
    }

    const existing = await getDiscountRepository().getById(req.params.id);
    if (!existing) {
        return res.status(404).json({ message: 'Descuento no encontrado' });
    }

    if (await getProductRepository().existsByDiscount(req.params.id)) {
        return res.status(409).json({ message: 'No se puede eliminar: el descuento está en uso por uno o más productos' });
    }

    await getDiscountRepository().remove(req.params.id);
    
    res.json({ message: 'Descuento eliminado correctamente' });
}