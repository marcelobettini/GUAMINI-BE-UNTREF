import express from 'express';
import jwt from 'jsonwebtoken';

process.loadEnvFile();

const app = express();
const PORT = process.env.PORT || 3008;
const secretKey = process.env.SECRET_KEY;
const userToValidate = { username: "Cameron", password: "H@lt4ndC4tchFire" };

app.use(express.json());

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    console.log(`Datos recibidos: Usuario: ${username}, Password: ${password}`);

    if (username === "Cameron" && password === "H@lt4ndC4tchFire") {
        const token = jwt.sign({ username: username }, secretKey, { expiresIn: '1h' });
        console.log(`Token generado: ${token}`);
        res.status(200).json({ token: token });
    } else {
        res.status(401).json({ error: 'Credenciales inválidas' });
    }
});

// La verificación del token va a fallar porque el formato 'Bearer <token>' no se está manejando correctamente. Si ponemos un console.log(token) luego de extraerlo del encabezado 'authorization', veremos que el token viene con el prefijo 'Bearer '. Para solucionarlo, debemos extraer solo la parte del token.

function verifyToken(req, res, next) {
    const token = req.headers['authorization'].split(" ")[1] || null;
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

app.get('/rutaprotegida', verifyToken, (req, res, next) => {
    const username = req.decoded.username || null;
    res.status(200).json({ "mensaje": "Has accedido correctamente a la ruta protegida.", "username": username });
    next();
});

app.listen(PORT, () => console.log(`Servidor iniciado en el puerto ${PORT}`));
