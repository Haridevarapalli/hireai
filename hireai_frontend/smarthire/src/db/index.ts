import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Store SQLite database file in the project root
const sqlite = new Database(path.join(process.cwd(), 'smarthire.db'));
export const db = drizzle(sqlite, { schema });
