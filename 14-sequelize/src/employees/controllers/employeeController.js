import { getAll, searchByLastName } from "../services/employeeService.js";

export async function getEmployees(req, res) {
    try {
        const { sort, order } = req.query;
        const employees = await getAll({ sort, order });
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export async function searchEmployees(req, res) {
    try {
        const { lastName } = req.query;
        if (!lastName?.trim()) {
            return res.status(400).json({ error: "El query param 'lastName' es obligatorio" });
        }
        const employees = await searchByLastName(lastName.trim());
        res.json(employees);
    } catch (error) {
        console.error('Error searching employees:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
