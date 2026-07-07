import { Router } from 'express';
import { getAll } from '../db/tasksStore.js';
const router = Router();
const VALID_PRIORITIES = ['low', 'mid', 'high'];

router.get("/", async (req, res, next) => {
    const tasks = await getAll();
    if (tasks.length === 0) {
        return res.status(404).json({ "message": "No hay tareas aún" });
    }
    res.json({ "message": "Todas las tareas", "tasks": tasks });
});


router.get("/:id", async (req, res, next) => {
    const { id } = req.params;
    res.json({ "message": `Tarea con id ${id}` });

});



router.post("/", (req, res, next) => {
    const { title, description = "", priority = "low" } = req.body;
    const now = new Date();
    const newTask = {
        title,
        description,
        priority,
        completed: false,
        createdAt: now,
        updatedAt: now
    };
    res.status(201).json(newTask);
});

router.patch("/:id", (req, res) => {
    const { id } = req.params;
    res.status(200).json({ message: `Tarea con id ${id} actualizada exitosamente` });
});

router.patch("/:id/toggle", (req, res, next) => {
    const { id } = req.params;
    res.json({ "message": `Cambia el estado true/false de tarea con id ${id}` });
});

router.delete("/:id", (req, res) => {
    const { id } = req.params;
    res.status(200).json({ message: `Tarea con id ${id} eliminada exitosamente` });
});

export default router;