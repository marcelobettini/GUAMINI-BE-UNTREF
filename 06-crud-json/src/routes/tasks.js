import { Router } from 'express';
const router = Router();
import { getAllTasks, getById, add } from '../services/fileStore.js';
const VALID_PRIORITIES = ['low', 'mid', 'high'];

router.get("/", (req, res, next) => {
    const tareas = getAllTasks();
    if (tareas.length === 0) {
        const error = new Error("No se encontraron tareas");
        error.status = 404;
        return next(error);
    }
    res.json(tareas);
});


router.get("/:id", (req, res, next) => {
    const { id } = req.params;
    try {
        const tarea = getById(id);
        if (!tarea) {
            const error = new Error("Tarea no encontrada");
            error.status = 404;
            return next(error);
        }
        res.json(tarea);
    } catch (error) {
        return next(error);
    }
});

// implementar 
/*
Notas: 
1. El campo id debe ser único y generado automáticamente (debe ser un UUID)-> crypto.randomUUID() para generar un id único

2. El campo title es obligatorio y debe ser una cadena de texto no vacía.

3. El campo description es opcional y puede ser una cadena de texto. Si el usuario no envía este campo, se debe establecer como una cadena vacía ("").

4. El campo priority es "low", "mid" o "high", y por defecto debe ser "low". Si el usuario no envía este campo, se debe establecer como "low". OPCIONAL: Si el usuario envía un valor que no es "low", "mid" o "high", se debe responder con un error 400 Bad Request. 

5. El campo completed es un booleano que indica si la tarea está completada o no, y por defecto debe ser false. El usuario no envía un valor inicial.

6. Los campos createdAt y updatedAt deben ser generados automáticamente por el servidor al crear o actualizar una tarea, respectivamente. El usuario no envía estos campos en la solicitud. Ejemplo: new Date() para generar la fecha actual en formato ISO 8601.

*/

router.post("/", (req, res, next) => {
    const { title, description = "", priority = "low" } = req.body;
    if (!title) {
        const error = new Error("El campo 'title' es obligatorio");
        error.status = 400;
        return next(error);

    }
    if (!VALID_PRIORITIES.includes(priority)) {
        const error = new Error("El campo porioridad debe contener 'mid' | 'low' | 'high' ");
        error.status = 400;
        return next(error);
    }
    const now = new Date();
    const task = {
        id: crypto.randomUUID(),
        title,
        description,
        priority,
        completed: false,
        createdAt: now,
        updatedAt: now
    };
    add(task);
    res.status(201).json(task);
});

// implementar 
router.put("/:id", (req, res) => {
    const { id } = req.params;
    res.status(200).json({ message: `Tarea ${id} actualizada exitosamente` });
    res.status(200).json({ message: `Tarea ${id} actualizada exitosamente` });
});

//implementar

router.patch("/:id", (req, res) => {
    const { id } = req.params;
    res.status(200).json({ message: `Tarea ${id} actualizada exitosamente` });

});



// implementar
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    res.status(200).json({ message: `Tarea ${id} eliminada exitosamente` });
});

export default router;