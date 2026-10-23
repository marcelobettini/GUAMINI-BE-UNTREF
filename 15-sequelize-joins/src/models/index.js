import { Category } from './category.model.js';
import { Product } from './product.model.js';
import { Supplier } from './supplier.model.js';

export {
    Category, Product, Supplier
};

// products -> categories / suppliers
Category.hasMany(Product, { foreignKey: 'CategoryID', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'CategoryID', as: 'category' });

Supplier.hasMany(Product, { foreignKey: 'SupplierID', as: "products" });
Product.belongsTo(Supplier, { foreignKey: 'SupplierID', as: "supplier" })

