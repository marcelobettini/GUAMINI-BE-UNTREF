import mongoose from "mongoose";
const usuarioSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true }
});

export default mongoose.model('Usuario', usuarioSchema);