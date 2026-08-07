import mongoose from "mongoose";
const productoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    importe: { type: Number, required: true },
    categoria: { type: String, required: true }
});

export default mongoose.model('Producto', productoSchema);