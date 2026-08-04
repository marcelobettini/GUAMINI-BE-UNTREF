import { createError, HTTP_STATUS } from "../middlewares/errorHandler.js";
import Dog from "../models/dog.js";

export async function getAllDogs(req, res, next) {
    try {
        const allDogs = await Dog.find();
        if (!allDogs.length) {
            throw createError(HTTP_STATUS.NOT_FOUND, "No hay perros en la base de datos");
        }
        return res.status(200).json(allDogs);

    } catch (error) {
        next(error);
    }
}

export async function getDogById(req, res, next) {
    try {

        const { id } = req.params;
        const dog = await Dog.findById(id);
        if (!dog) {
            throw createError(HTTP_STATUS.NOT_FOUND, "No hay perro con ese id");
        }
        return res.status(200).json(dog);
    } catch (error) {
        next(error);
    }
}

export async function createDog(req, res, next) {
    try {
        const newDog = new Dog({ ...req.body });
        const insertedDog = await newDog.save();
        return res.status(201).json(insertedDog);
    } catch (error) {
        next(error);
    }
}

export async function updateDog(req, res, next) {
    try {
        const { id } = req.params;
        const updatedDog = await Dog.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedDog) {
            throw createError(HTTP_STATUS.NOT_FOUND, "No hay perro con ese id");
        }
        return res.status(200).json(updatedDog);
    } catch (error) {
        next(error);
    }
}

export async function deleteDog(req, res, next) {
    try {

        const { id } = req.params;
        const deletedDog = await Dog.findByIdAndDelete(id);
        if (!deletedDog) {
            throw createError(HTTP_STATUS.NOT_FOUND, "No hay perro con ese id");
        }
        return res.status(200).json(deletedDog);
    } catch (error) {
        next(error);
    }
}