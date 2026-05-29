import express from 'express';
import path from 'node:path';
import women from './data/women.json' with {type: 'json'};
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT ?? 3000;

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {

    res.render('index', { title: "Prueba de Express y EJS", description: "Esta es una prueba de cómo usar EJS con Express" });
});

app.get('/women', (req, res) => {
    res.render('women', { women });
});

app.use((req, res) => {
    res.status(404).json({ message: "Ruta inexistente" });
});
app.listen(3000, (err) => {
    console.log(err ? err.message : `Server is running on http://localhost:${PORT}`);
});
