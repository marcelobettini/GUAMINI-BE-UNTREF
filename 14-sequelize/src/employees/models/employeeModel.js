import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Employee = sequelize.define('Employee', {
    employeeID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    lastName: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(30)
    },
    titleOfCourtesy: {
        type: DataTypes.STRING(25)
    },
    birthDate: {
        type: DataTypes.DATE
    },
    hireDate: {
        type: DataTypes.DATE
    },
    address: {
        type: DataTypes.STRING(60)
    },
    city: {
        type: DataTypes.STRING(15)
    },
    region: {
        type: DataTypes.STRING(15)
    },
    postalCode: {
        type: DataTypes.STRING(10)
    },
    country: {
        type: DataTypes.STRING(15)
    },
    homePhone: {
        type: DataTypes.STRING(24)
    },
    extension: {
        type: DataTypes.STRING(4)
    },
    photo: {
        type: DataTypes.BLOB('long')
    },
    notes: {
        type: DataTypes.TEXT('long')
    },
    // Auto-referencia: ReportsTo apunta a Employee.employeeID (el jefe del empleado, que también es un empleado)
    reportsTo: {
        type: DataTypes.INTEGER
    },
    photoPath: {
        type: DataTypes.STRING(255)
    }
}, {
    tableName: 'Employees',
    timestamps: false
});

export default Employee;
