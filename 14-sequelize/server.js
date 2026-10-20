import { connect } from "./src/config/database.js";
import productRouter from "./src/products/routes/productRoutes.js";
import employeeRouter from "./src/employees/routes/employeeRoutes.js";

import express from 'express';
const app = express();
const PORT = process.env.PORT || 3000;

// Necesario para parsear JSON en req.body (POST/PUT/PATCH)
app.use(express.json());

app.use('/products', productRouter);
app.use('/employees', employeeRouter);

app.listen(PORT, async () => {
    await connect();
});