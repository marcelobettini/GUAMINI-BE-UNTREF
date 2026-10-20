import { Op } from "sequelize";
import Product from "../models/productModel.js";

export async function getAll() {
    return Product.findAll();
}

// Productos visibles en el catálogo (no descontinuados)
export async function getAllActive() {
    return Product.findAll({
        where: {
            Discontinued: false
        }
    });
}

// Productos dados de baja / descontinuados (histórico / administración)
export async function getAllDiscontinued() {
    return Product.findAll({
        where: {
            Discontinued: true
        }
    });
}

export async function getById(id) {
    return Product.findByPk(id);
}


export async function searchByName(text, includeDiscontinued = false) {
    // Escapamos los comodines de LIKE (%, _ y \) para que la búsqueda sea literal:
    // sin esto, un "%" en el query param devolvería todo porque SQL lo interpreta como un comodín en vez de un carácter literal.
    const escaped = text.replace(/[\\%_]/g, "\\$&");
    const where = {
        productName: {
            [Op.like]: `%${escaped}%`
        }
    };
    // Por defecto, solo buscar en productos activos (catálogo)
    if (!includeDiscontinued) {
        where.Discontinued = false;
    }
    return Product.findAll({ where });
}

// Crea un nuevo producto. Dejamos que Sequelize aplique defaults del modelo
// para campos no enviados; solo validamos/normalizamos en el controller.
export async function create(data) {
    return Product.create(data);
}

// Actualiza un producto existente. Busca por PK, si no existe retorna null.
// Usa instance.update() para respetar validaciones/hooks de Sequelize.
export async function update(id, data) {
    const product = await getById(id);
    if (!product) {
        return null;
    }
    return product.update(data);
}

// Soft delete: marca el producto como descontinuado (Discontinued: true)
// Idempotente: si ya está descontinuado, devuelve el producto tal como está.
export async function discontinue(id) {
    const product = await getById(id);
    if (!product) {
        return null;
    }
    if (product.Discontinued) {
        return product;
    }
    return product.update({ Discontinued: true });
}

// Reactivar un producto descontinuado (lo reincorpora al listado activo)
export async function reactivate(id) {
    const product = await getById(id);
    if (!product) {
        return null;
    }
    if (!product.Discontinued) {
        return product;
    }
    return product.update({ Discontinued: false });
}
