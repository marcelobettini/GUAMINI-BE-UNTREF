import { Router } from "express";
import { getAll, getById, add, update, remove, toggle } from "../services/taskService.js";

const router = Router();
const VALID_PRIORITIES = ["low", "mid", "high"];

// GET /api/v1/tasks
router.get("/", async (req, res) => {
    const { completed, search } = req.query;
    const filters = {};
    if (completed !== undefined) filters.completed = completed === "true";
    if (search) filters.search = search;

    const tasks = await getAll(filters);
    if (!tasks.length) {
        return res.status(404).json({ message: "No se encontraron tareas" });
    }
    res.json(tasks);
});

// GET /api/v1/tasks/:id
router.get("/:id", async (req, res) => {
    const task = await getById(req.params.id);
    if (!task) return res.status(404).json({ message: `No se encontró la tarea con id ${req.params.id}` });
    res.json(task);
});

// POST /api/v1/tasks
router.post("/", async (req, res) => {
    const title = req.body.title?.trim();
    const description = (req.body.description ?? "").trim();
    const { priority = "low" } = req.body;
    if (!title) return res.status(400).json({ message: "El campo title es obligatorio" });
    if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ message: `El campo priority debe ser uno de: ${VALID_PRIORITIES.join(", ")}` });
    }
    const now = new Date().toISOString();
    const task = await add({
        title,
        description,
        priority,
        completed: false,
        createdAt: now,
        updatedAt: now,
    });
    res.status(201).json(task);
});

// PATCH /api/v1/tasks/:id/toggle — before /:id so Express doesn't treat "toggle" as an id
router.patch("/:id/toggle", async (req, res) => {
    const task = await toggle(req.params.id);
    if (!task) return res.status(404).json({ message: `No se encontró la tarea con id ${req.params.id}` });
    res.json(task);
});

// PATCH /api/v1/tasks/:id
router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const task = await getById(id);
    if (!task) return res.status(404).json({ message: `No se encontró la tarea con id ${id}` });

    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const { priority, completed } = req.body;
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ message: `El campo priority debe ser uno de: ${VALID_PRIORITIES.join(", ")}` });
    }
    const fields = {};
    if (title !== undefined) fields.title = title;
    if (description !== undefined) fields.description = description;
    if (priority !== undefined) fields.priority = priority;
    if (completed !== undefined) fields.completed = completed;
    fields.updatedAt = new Date().toISOString();

    const updated = await update(id, fields);
    res.json(updated);
});

// DELETE /api/v1/tasks/:id
router.delete("/:id", async (req, res) => {
    const removed = await remove(req.params.id);
    if (!removed) return res.status(404).json({ error: "Task not found" });
    res.status(204).send();
});

export default router;
