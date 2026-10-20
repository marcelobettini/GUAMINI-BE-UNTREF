import { Router } from "express";
import { getProducts, getAllProducts, getDiscontinuedProducts, getProductById, searchProducts, createProduct, updateProduct, discontinueProduct, reactivateProduct } from "../controllers/productController.js";

const router = Router();

// GET /products
router.get('/', getProducts);

// GET /products/all — listado completo (incluye descontinuados) para administración/histórico
router.get('/all', getAllProducts);

// GET /products/discontinued — productos dados de baja / descontinuados
router.get('/discontinued', getDiscontinuedProducts);

// POST /products
router.post('/', createProduct);

// GET /products/s?q=texto — búsqueda por texto parcial en productName (activos por defecto).
// Recuerden que Va ANTES de /:id, si no Express captura "s" como si fuera un id.
router.get('/s', searchProducts);

// PATCH /products/:id/reactivate — reincorporar un producto descontinuado al catálogo
router.patch('/:id/reactivate', reactivateProduct);

// PATCH /products/:id — actualización parcial (permite reactivar también con { Discontinued: false })
router.patch('/:id', updateProduct);

// DELETE /products/:id — soft delete (marca Discontinued: true)
router.delete('/:id', discontinueProduct);

// GET /products/:id
router.get('/:id', getProductById);

export default router;
