import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), "./db/Overallkey_Inventory.db");
const db = new sqlite3.Database(dbPath);

export default db;