import { Router } from 'express';
import * as supplierController from '../controllers/supplier.controller.js';

export const supplierRouter = Router();
supplierRouter.get('/', supplierController.getAllSuppliers);
supplierRouter.get('/:id', supplierController.getSupplierById);