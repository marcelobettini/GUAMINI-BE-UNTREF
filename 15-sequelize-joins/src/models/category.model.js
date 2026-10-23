import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Category = sequelize.define(
    'Category',
    {
        CategoryID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        CategoryName: { type: DataTypes.STRING(15), allowNull: false },
        Description: { type: DataTypes.TEXT },
        Picture: { type: DataTypes.BLOB('long') },
    },
    {
        tableName: 'categories',
        timestamps: false,
        defaultScope: {
            attributes: { exclude: ['Picture'] },
        },
    }
);