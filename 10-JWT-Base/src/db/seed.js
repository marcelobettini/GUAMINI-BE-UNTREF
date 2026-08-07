import Usuario from "../models/Usuario.js";
import Producto from "../models/Producto.js";
import productos from "../productos.js";
import usuarios from "../usuarios.js";

export async function seedDatabase() {
    if (await Usuario.countDocuments() === 0) {
        await Usuario.insertMany(usuarios);
        console.log("Colección 'usuarios' sembrada. 🌱");
    }
    if (await Producto.countDocuments() === 0) {
        await Producto.insertMany(productos);
        console.log("Colección 'productos' sembrada. 🌱");
    }


}