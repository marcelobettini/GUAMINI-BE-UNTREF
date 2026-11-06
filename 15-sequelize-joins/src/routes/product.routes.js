import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as productController from '../controllers/product.controller.js';

const productsLimiter = rateLimit({
    windowMs: 15 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
export const productRouter = Router();
productRouter.get('/', productsLimiter, productController.getAllProducts);
productRouter.get('/:id', productsLimiter, productController.getProductById);