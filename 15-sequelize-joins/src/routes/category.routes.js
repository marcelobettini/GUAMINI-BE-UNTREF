import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';

export const categoryRouter = Router();
categoryRouter.get('/', categoryController.getAllCategories);
categoryRouter.get('/:id', categoryController.getCategoryById);