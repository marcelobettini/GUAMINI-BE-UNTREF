import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Product = sequelize.define('Product', {
    productID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    SupplierID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    CategoryID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    QuantityPerUnit: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "N/A",
    },
    UnitPrice: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0.00,
    },
    UnitsInStock: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
    },
    UnitsOnOrder: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
    },
    ReorderLevel: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 1,
    },
    Discontinued: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
    }
}, {
    tableName: 'Products',
    timestamps: false
});

export default Product;