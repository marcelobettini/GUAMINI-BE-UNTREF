import { Router } from "express";
import { getEmployees, searchEmployees } from "../controllers/employeeController.js";

const router = Router();

// GET /employees?sort=lastName&order=asc|desc — sort blanco: lastName | title
router.get('/', getEmployees);

// GET /employees/s?lastName=texto — búsqueda parcial por apellido.
// Va ANTES de /:id, si no Express captura "s" como si fuera un id.
router.get('/s', searchEmployees);

export default router;
