import { Product, Category, Supplier } from '../models/index.js';


export function getAllProducts() {
    return Product.findAll({
        include: [
            { model: Category, as: 'category', attributes: ['CategoryName'] },
            { model: Supplier, as: 'supplier', attributes: ['CompanyName', 'ContactName', 'Phone'] }
        ],
        order: [['ProductName', 'ASC']]
    });
}