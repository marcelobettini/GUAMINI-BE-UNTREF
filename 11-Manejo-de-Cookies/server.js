import express from "express";
import cookieParser from "cookie-parser";
import vistaPrincipal from './views/views.js';
process.loadEnvFile();
const PORT = process.env.PORT;
const app = express();

app.use(cookieParser());

app.get("/", (req, res) => {
    const datosEnCookie = new Date();
    const IMCookieText = "Este mensaje se autodestruirá, señor Hunt...";
    res.cookie('nodeCookie', datosEnCookie);
    res.cookie('IMCookie', IMCookieText, { maxAge: 10000 });
    res.status(200).send(vistaPrincipal);
});

app.get('/leer-cookie', (req, res) => {
    const fechaAcceso = req.cookies.nodeCookie || 'No hay registro previo';
    const message = req.cookies.IMCookie || 'Se autodestruyó';
    res.status(200).json({ "Fecha último acceso": fechaAcceso, "Message": message });
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