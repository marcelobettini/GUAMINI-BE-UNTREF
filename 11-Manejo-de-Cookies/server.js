require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const vistaPrincipal = require('./views/views.js');
const PORT = process.env.PORT ?? 3456;
const app = express();

app.use(cookieParser());

app.get("/", (req, res) => {
    const datosEnCookie = new Date();
    res.cookie('nodeCookie', datosEnCookie);
    res.status(200).send(vistaPrincipal);
});

app.get('/leer-cookie', (req, res) => {
    const fechaAcceso = req.cookies.nodeCookie || 'No hay registro previo';
    res.status(200).send('Fecha del último acceso: ' + fechaAcceso);
});

app.get('/eliminar-cookie', (req, res) => {
    const fechaAcceso = req.cookies.nodeCookie || 'No hay registro previo';
    if (fechaAcceso !== 'No hay registro previo') {
        res.clearCookie('nodeCookie');
        res.status(200).send('Se eliminó la cookie con el registro: ' + fechaAcceso);
    } else {
        res.status(406).send('No se encontró una cookie para eliminar.');
    }
});

app.listen(PORT, () => {
    console.log('Server listening on port:', PORT);
});