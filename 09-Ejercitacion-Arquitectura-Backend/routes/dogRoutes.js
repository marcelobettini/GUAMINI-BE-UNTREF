import Router from 'express';
const router = Router();
import { getAllDogs, getDogById, createDog, updateDog, deleteDog } from "../controllers/dogController.js";

// base url -> /api/perros
router.get('/', getAllDogs);

router.get('/:id', getDogById);

router.post('/', createDog);

router.put('/:id', updateDog);

router.delete('/:id', deleteDog);

export default router;
