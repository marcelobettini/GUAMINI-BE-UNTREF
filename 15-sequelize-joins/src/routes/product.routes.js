import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';

export const productRouter = Router();
productRouter.get('/', productController.getAllProducts);
productRouter.get('/:id', productController.getProductById);