import { Router } from 'express';
import { productRouter } from './product.routes.js';
import { categoryRouter } from './category.routes.js';
import { supplierRouter } from './supplier.routes.js';

export const apiRouter = Router();
apiRouter.use('/products', productRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/suppliers', supplierRouter);