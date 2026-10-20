import { getAllActive, getAllDiscontinued, getAll, getById, searchByName, create, update, discontinue, reactivate } from "../services/productService.js";

export async function getProducts(req, res) {
    try {
        const products = await getAllActive();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function getAllProducts(req, res) {
    try {
        const products = await getAll();
        res.json(products);
    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function getDiscontinuedProducts(req, res) {
    try {
        const products = await getAllDiscontinued();
        res.json(products);
    } catch (error) {
        console.error('Error fetching discontinued products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function getProductById(req, res) {
    try {
        const { id } = req.params;
        const product = await getById(id);
        if (!product) {
            return res.status(404).json({ error: `No se encontró producto con id ${id}` });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product by id:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function searchProducts(req, res) {
    try {
        const { q } = req.query;
        if (!q?.trim()) {
            return res.status(400).json({ error: "El query param 'q' es obligatorio" });
        }
        // Por defecto solo busca en productos activos (catálogo).
        // Si se necesita buscar también en descontinuados, se puede pasar ?includeDiscontinued=true
        const includeDiscontinued = req.query.includeDiscontinued === 'true';
        const products = await searchByName(q.trim(), includeDiscontinued);
        res.json(products);
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function createProduct(req, res) {
    try {
        const body = req.body || {};

        // No permitir setear el PK (autoIncrement). Si viene, lo ignoramos para evitar sorpresas.
        if (body.productID !== undefined) {
            delete body.productID;
        }

        // productName es obligatorio según el modelo (allowNull: false, sin default)
        if (typeof body.productName !== 'string') {
            return res.status(400).json({ error: "El campo 'productName' es obligatorio" });
        }
        const productName = body.productName.trim();
        if (productName === '') {
            return res.status(400).json({ error: "El campo 'productName' es obligatorio" });
        }
        body.productName = productName;

        // Validaciones básicas solo si vienen: mantener simple y evitar rechazos innecesarios
        if (body.UnitPrice !== undefined) {
            const unitPrice = Number(body.UnitPrice);
            if (Number.isNaN(unitPrice) || unitPrice < 0) {
                return res.status(400).json({ error: "'UnitPrice' debe ser un número >= 0" });
            }
            body.UnitPrice = unitPrice;
        }
        if (body.UnitsInStock !== undefined) {
            const unitsInStock = Number(body.UnitsInStock);
            if (!Number.isInteger(unitsInStock) || unitsInStock < 0) {
                return res.status(400).json({ error: "'UnitsInStock' debe ser un entero >= 0" });
            }
            body.UnitsInStock = unitsInStock;
        }
        if (body.UnitsOnOrder !== undefined) {
            const unitsOnOrder = Number(body.UnitsOnOrder);
            if (!Number.isInteger(unitsOnOrder) || unitsOnOrder < 0) {
                return res.status(400).json({ error: "'UnitsOnOrder' debe ser un entero >= 0" });
            }
            body.UnitsOnOrder = unitsOnOrder;
        }
        if (body.ReorderLevel !== undefined) {
            const reorderLevel = Number(body.ReorderLevel);
            if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
                return res.status(400).json({ error: "'ReorderLevel' debe ser un entero >= 0" });
            }
            body.ReorderLevel = reorderLevel;
        }
        if (body.Discontinued !== undefined) {
            if (typeof body.Discontinued !== 'boolean') {
                // Aceptar 0/1 por conveniencia sin romper the tipo esperado por Sequelize
                if (body.Discontinued === 0 || body.Discontinued === 1) {
                    body.Discontinued = body.Discontinued === 1;
                } else {
                    return res.status(400).json({ error: "'Discontinued' debe ser booleano" });
                }
            }
        }

        const product = await create(body);
        // 201 Created: recurso creado correctamente
        return res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        // Si Sequelize lanza ValidationError por alguna constraint not covered above, devolvemos 400
        if (error?.name === 'SequelizeValidationError') {
            const messages = error.errors?.map((e) => e.message).join(', ');
            return res.status(400).json({ error: messages || 'Error de validación' });
        }
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function discontinueProduct(req, res) {
    try {
        const { id } = req.params;
        const product = await discontinue(id);
        if (!product) {
            return res.status(404).json({ error: `No se encontró producto con id ${id}` });
        }
        return res.status(200).json(product);
    } catch (error) {
        console.error('Error discontinuing product:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function reactivateProduct(req, res) {
    try {
        const { id } = req.params;
        const product = await reactivate(id);
        if (!product) {
            return res.status(404).json({ error: `No se encontró producto con id ${id}` });
        }
        return res.status(200).json(product);
    } catch (error) {
        console.error('Error reactivating product:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const body = req.body || {};

        // ALLOWED: lista blanca de campos que SÍ se pueden modificar.
        // No es un DTO con tipos, es un allowlist para evitar modificar el PK
        // (productID) u otros campos inesperados. Los tipos/validaciones los
        // hacemos manualmente aquí (igual que en createProduct).
        const ALLOWED = [
            'productName',
            'SupplierID',
            'CategoryID',
            'QuantityPerUnit',
            'UnitPrice',
            'UnitsInStock',
            'UnitsOnOrder',
            'ReorderLevel',
            'Discontinued'
        ];

        // No permitir setear el PK (autoIncrement). Si viene, lo ignoramos para evitar sorpresas.
        if (body.productID !== undefined) {
            delete body.productID;
        }

        // Sanitizamos: solo copiamos campos permitidos que vengan en el body
        const data = {};
        for (const key of ALLOWED) {
            if (Object.hasOwn(body, key)) {
                data[key] = body[key];
            }
        }

        // Si no hay campos válidos para actualizar, devolvemos 400 (evita UPDATE innecesario)
        if (Object.keys(data).length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        // Validaciones y normalización condicionales (solo para lo que viene)
        if (data.productName !== undefined) {
            if (typeof data.productName !== 'string') {
                return res.status(400).json({ error: "El campo 'productName' debe ser un texto" });
            }
            const productName = data.productName.trim();
            if (productName === '') {
                return res.status(400).json({ error: "El campo 'productName' no puede estar vacío" });
            }
            data.productName = productName;
        }
        if (data.UnitPrice !== undefined) {
            const unitPrice = Number(data.UnitPrice);
            if (Number.isNaN(unitPrice) || unitPrice < 0) {
                return res.status(400).json({ error: "'UnitPrice' debe ser un número >= 0" });
            }
            data.UnitPrice = unitPrice;
        }
        if (data.UnitsInStock !== undefined) {
            const unitsInStock = Number(data.UnitsInStock);
            if (!Number.isInteger(unitsInStock) || unitsInStock < 0) {
                return res.status(400).json({ error: "'UnitsInStock' debe ser un entero >= 0" });
            }
            data.UnitsInStock = unitsInStock;
        }
        if (data.UnitsOnOrder !== undefined) {
            const unitsOnOrder = Number(data.UnitsOnOrder);
            if (!Number.isInteger(unitsOnOrder) || unitsOnOrder < 0) {
                return res.status(400).json({ error: "'UnitsOnOrder' debe ser un entero >= 0" });
            }
            data.UnitsOnOrder = unitsOnOrder;
        }
        if (data.ReorderLevel !== undefined) {
            const reorderLevel = Number(data.ReorderLevel);
            if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
                return res.status(400).json({ error: "'ReorderLevel' debe ser un entero >= 0" });
            }
            data.ReorderLevel = reorderLevel;
        }
        if (data.SupplierID !== undefined) {
            const supplierID = Number(data.SupplierID);
            if (!Number.isInteger(supplierID) || supplierID < 0) {
                return res.status(400).json({ error: "'SupplierID' debe ser un entero >= 0" });
            }
            data.SupplierID = supplierID;
        }
        if (data.CategoryID !== undefined) {
            const categoryID = Number(data.CategoryID);
            if (!Number.isInteger(categoryID) || categoryID < 0) {
                return res.status(400).json({ error: "'CategoryID' debe ser un entero >= 0" });
            }
            data.CategoryID = categoryID;
        }
        if (data.Discontinued !== undefined) {
            if (typeof data.Discontinued !== 'boolean') {
                // Aceptar 0/1 por conveniencia sin romper el tipo esperado por Sequelize
                if (data.Discontinued === 0 || data.Discontinued === 1) {
                    data.Discontinued = data.Discontinued === 1;
                } else {
                    return res.status(400).json({ error: "'Discontinued' debe ser booleano" });
                }
            }
        }

        const product = await update(id, data);
        if (!product) {
            return res.status(404).json({ error: `No se encontró producto con id ${id}` });
        }

        return res.status(200).json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        // Si Sequelize lanza ValidationError por alguna constraint no cubierta arriba, devolvemos 400
        if (error?.name === 'SequelizeValidationError') {
            const messages = error.errors?.map((e) => e.message).join(', ');
            return res.status(400).json({ error: messages || 'Error de validación' });
        }
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
