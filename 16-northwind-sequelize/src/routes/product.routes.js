// Router de `products`. Solo declara rutas; la lógica vive en el controlador.
import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { validate } from '../middlewares/validate.js';
import { productSchema } from '../schemas/product.schema.js';

export const productRouter = Router();

productRouter.get('/', productController.list);
productRouter.get('/:id', productController.getById);
productRouter.post('/', validate(productSchema), productController.create);

export const publicProductRouter = Router();
// El catálogo es público y de solo lectura.
publicProductRouter.get('/', productController.listPublic);
