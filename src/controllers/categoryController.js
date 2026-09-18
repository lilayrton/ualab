import { getCategoryRepository } from "../repositories/CategoryRepository.js";
import { slugify } from '../utils/slug.js';

// GET /api/categories/public - categorías habilitadas (sin token)
export async function getPublicCategories(req, res) {
    const tree = await getCategoryRepository().getTree({ onlyEnabled: true });

    res.json(tree);
}

// GET /api/categories - listado de todas las categorías
export async function getCategories(req, res) {
    const categories = await getCategoryRepository().getAll();

    res.json(categories);
}

// GET /api/categories/tree - árbol anidado completo
export async function getCategoryTree(req, res) {
    const tree = await getCategoryRepository().getTree();

    res.json(tree);
}

// GET /api/categories/:id - detalle
export async function getCategory(req, res) {
    const category = await getCategoryRepository().getById(req.params.id);

    if (!category) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    res.json(category);
}

// POST /api/categories - crear categoría
export async function createCategory(req, res) {
    const categoryRepo = getCategoryRepository();

    const { name, description, slug, isEnabled, sortOrder, parentId } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'El nombre de la categoría es obligatorio' });
    }

    if (parentId) {
        const parent = await categoryRepo.getById(parentId);

        if (!parent) {
            return res.status(400).json({ message: 'La categoría padre no existe' });
        }
    }

    const finalSlug = slug?.trim() ? slug.trim() : slugify(name);

    if (await categoryRepo.slugExists(finalSlug)) {
        return res.status(400).json({ message: `El slug "${finalSlug}" ya está en uso` });
    }

    const category = await categoryRepo.create({
        name: name.trim(),
        description: description?.trim() ?? '',
        slug: finalSlug,
        isEnabled: isEnabled ?? true,
        sortOrder: sortOrder ?? 0,
        parentId: parentId ?? null
    });

    res.status(201).json(category);
}

// PUT /api/categories/:id - actualizar categoría
export async function updateCategory(req, res) {
    const categoryRepo = getCategoryRepository();

    const existing = await categoryRepo.getById(req.params.id);
    
    if (!existing) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    const { name, description, slug, isEnabled, sortOrder, parentId } = req.body;
    const data = {};

    if (name !== undefined) {
        data.name = name.trim();
    }

    if (description !== undefined) {
        data.description = description?.trim() ?? '';
    }

    if (isEnabled !== undefined) {
        data.isEnabled = isEnabled;
    }
    
    if (sortOrder !== undefined) {
        data.sortOrder = sortOrder;
    }

    if (slug !== undefined) {
        const finalSlug = slug?.trim() ? slug.trim() : slugify(name ?? existing.name);
        
        if (await categoryRepo.slugExists(finalSlug, existing.id)) {
            return res.status(400).json({ message: `El slug "${finalSlug}" ya está en uso` });
        }

        data.slug = finalSlug;
    }

    if (parentId !== undefined) {
        const parentIdStr = parentId ? String(parentId) : null;

        if (parentIdStr && String(parentIdStr) === String(existing.id)) {
            return res.status(400).json({ message: 'Una categoría no puede ser su propia categoría padre' });
        }

        if (parentIdStr) {
            const parent = await categoryRepo.getById(parentIdStr);
            
            if (!parent) {
                return res.status(400).json({ message: 'La categoría padre no existe' });
            }

            if (await categoryRepo.hasAncestor(existing.id, parentIdStr)) {
                return res.status(400).json({ message: 'No se puede asignar un descendiente como categoría padre (generaría un ciclo)' });
            }
        }

        data.parentId = parentIdStr;
    }

    const category = await categoryRepo.update(req.params.id, data);

    res.json(category);
}

// DELETE /api/categories/:id - eliminar categoría
export async function deleteCategory(req, res) {
    const categoryRepo = getCategoryRepository();

    const existing = await categoryRepo.getById(req.params.id);
    
    if (!existing) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    if (await categoryRepo.hasChildren(existing.id)) {
        return res.status(409).json({ message: 'No se puede eliminar: la categoría tiene categorías hijas' });
    }

    await categoryRepo.remove(existing.id);
    
    res.json({ message: 'Categoría eliminada correctamente' });
}