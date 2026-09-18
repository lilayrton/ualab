import { serializeCategory } from './serializers.js';

export function isDescendant(categories, categoryId, candidateId) {
    if (String(categoryId) === String(candidateId)) {
        return true;
    }

    const children = categories.filter(c => c.parentId === String(categoryId));

    return children.some(child => isDescendant(categories, child.id, candidateId));
}

function sortNodes(nodes) {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

    for (const node of nodes) {
        if (node.children) {
            sortNodes(node.children);
        }
    }
}

function filterEnabled(nodes) {
    return nodes
        .filter(n => n.isEnabled)
        .map(n => ({
            ...n,
            children: n.children ? filterEnabled(n.children) : []
        }));
}

export function buildTree(categories, { onlyEnabled = false } = {}) {
    const nodes = categories.map(cat => serializeCategory(cat));
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const roots = [];

    for (const node of nodes) {
        if (onlyEnabled && !node.isEnabled) {
            continue;
        }

        const parentId = node.parentId;
        if (parentId && nodeMap.has(parentId)) {
            const parent = nodeMap.get(parentId);

            if (!parent.children) {
                parent.children = [];
            }

            parent.children.push(node);
        } else {
            roots.push(node);
        }
    }

    if (onlyEnabled) {
        const filtered = filterEnabled(roots);
        sortNodes(filtered);
        return filtered;
    }

    sortNodes(roots);
    return roots;
}