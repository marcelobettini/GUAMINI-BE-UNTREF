import express from 'express';
import jwt from 'jsonwebtoken';
import Producto from './src/models/Producto.js';
import Usuario from './src/models/Usuario.js';
import { connectDB } from "./src/db/connection.js";
import { seedDatabase } from './src/db/seed.js';
process.loadEnvFile();

const app = express();
const PORT = process.env.PORT || 3008;
const secretKey = process.env.SECRET_KEY;

app.use(express.json());

app.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    console.log(`Datos recibidos: Usuario: ${username}, Password: ${password}`);

    const userToValidate = await Usuario.findOne({ username });

    if (username === userToValidate.username && password === userToValidate.password) {
        const token = jwt.sign({ username: username }, secretKey, { expiresIn: '1h' });
        res.status(200).json({ token: token });
    } else {
        res.status(401).json({ error: 'Credenciales inválidas' });
    }
});


function verifyToken(req, res, next) {
    //Los JWT se envían en el encabezado de autorización con el formato "Bearer <token>". Solo necesitamos el token, por lo que lo extraemos del encabezado. 
    // optional chaining operator
    const token = req.headers['authorization']?.split(" ")[1];

    if (token) {
        jwt.verify(token, secretKey, (err, decoded) => {
            err ? res.status(401).json({ error: 'Token inválido.' })
                : req.decoded = decoded;
            next();
        });
    } else {
        res.status(401).json({ error: 'Token no proporcionado.' });
    }
}

app.get('/productos', verifyToken, async (req, res, next) => {
    const productos = await Producto.find();
    res.status(200).json(productos);
    next();
});

async function iniciarServidor() {
    await connectDB();
    await seedDatabase();
    app.listen(PORT, () => console.log(`Servidor iniciado en el puerto ${PORT}`));

}
iniciarServidor()

