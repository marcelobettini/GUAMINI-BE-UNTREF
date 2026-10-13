import sequelize from "./src/config/database.js";
import Product from "./src/models/product.js";

import express from 'express';
const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    console.log(`Server running on port ${PORT}`);
});

app.get('/products', async (req, res) => {
    try {
        const rawProducts = await Product.findAll();
        const products = rawProducts.map(prod => prod.dataValues);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});