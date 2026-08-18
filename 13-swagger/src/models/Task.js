//Modelo Mongoose de una tarea (Task) para la colección "tasks" de la base de datos
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
        completed: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        versionKey: false, // Desactiva la propiedad __v que Mongoose agrega por defecto
        toJSON: {
            transform: (doc, ret) => {
                ret.id = ret._id.toString(); // Convertir ObjectId a string
                delete ret._id;
                return ret;
            }
        }
    });

export default mongoose.model('Task', taskSchema);