import * as productService from '../services/product.service.js';
export const getAllProducts = async (req, res) => {
    const products = await productService.getAllProducts();
    res.json(products);
};

export const getProductById = async (req, res) => { };