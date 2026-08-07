import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
let mongod;
export async function connectDB() {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await mongoose.connect(uri, { dbName: "jwt-test" });
    console.log(`Base de datos en memoria conectada. (${uri})`);
}

export async function disconnectDB() {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
}