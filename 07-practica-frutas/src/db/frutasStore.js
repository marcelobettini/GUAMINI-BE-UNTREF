import { getDb } from "./mongoClient.js";
// Devuelve todas las frutas. 
export async function getAll() {

    return getDb().collection('frutas').find().toArray();
}

export async function getByName(name) {
    // cambiar lo que corresponda
    return getDb().collection('frutas').find().toArray();
}
export async function getByPrice(price) {
    // cambiar lo que corresponda
    return getDb().collection('frutas').find().toArray();
}