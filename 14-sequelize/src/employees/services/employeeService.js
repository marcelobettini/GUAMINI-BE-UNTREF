import { Op } from "sequelize";
import Employee from "../models/employeeModel.js";

// ---------------------------------------------------------------------------
// WHITELIST (lista blanca) de columnas ordenables
// ---------------------------------------------------------------------------
// El usuario puede pedir el orden desde la URL:
//   GET /employees?sort=lastName&order=asc
//
// El problema: el valor de ?sort= lo escribe CUALQUIERA que use la API, y llega
// tal cual hasta la query SQL. Si lo concatenáramos directo:
//
//   order: [[req.query.sort, order]]   // NUNCA hacer esto
//
// el atacante podría mandar cualquier cosa, por ejemplo:
//   ?sort=password            → MySQL intenta ordenar por una columna inexistente
//                                y tira error 500 (o expone que hay una columna
//                                "password" si el error se filtra al cliente).
//   ?sort=lastName;DROP TABLE Employees  → SQL injection: sin whitelist, el
//                                string viaja entero dentro de la sentencia.
//
// ¿Por qué no se puede usar un placeholder (?) como con WHERE? Porque en SQL
// los placeholders solo reemplazan VALORES ('lastName'), no IDENTIFICADORES
// (el nombre de la columna). ORDER BY necesita el identificador en texto plano,
// entonces la única defensa válida es: NO concatenar lo que llega del usuario.
//
// La whitelist funciona como puerta: solo deja pasar sort=lastName o sort=title
// (los únicos que queremos exponer). Cualquier otro valor (inexistente, vacío,
// o con intención maliciosa) no matchea el objeto SORTABLE, el if de getAll()
// no se cumple y se ignora silenciosamente: la query se ejecuta sin ORDER BY.
//
// El mapeo clave→valor además evita mandar el string crudo a Sequelize:
// aunque el usuario mande "lastName", lo que viaja a la query es el valor del
// objeto (que nosotros escribimos), nunca el input. Si mañana se agrega una
// columna ordenable, se suma acá y en ningún otro lado.
const SORTABLE = { lastName: "lastName", title: "title" };

export async function getAll({ sort, order } = {}) {
    const orderClause = [];
    if (sort && SORTABLE[sort]) {
        const direction = String(order).toUpperCase() === "DESC" ? "DESC" : "ASC";
        orderClause.push([SORTABLE[sort], direction]);
    }
    return Employee.findAll({ order: orderClause });
}

// Búsqueda parcial por apellido. LIKE en MySQL ya es case-insensitive
// según la collation de la columna, no hace falta UPPER() o LOWER().
export async function searchByLastName(lastName) {
    // Escapamos los comodines de LIKE (%, _ y \) para que la búsqueda sea literal
    const escaped = lastName.replace(/[\\%_]/g, "\\$&");
    return Employee.findAll({
        where: {
            lastName: {
                [Op.like]: `%${escaped}%`
            }
        }
    });
}
