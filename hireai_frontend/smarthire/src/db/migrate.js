const { drizzle } = require('drizzle-orm/better-sqlite3');
const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
const Database = require('better-sqlite3');
const path = require('path');

const sqlite = new Database(path.join(process.cwd(), 'smarthire.db'));
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: './drizzle' });
console.log('Migration complete');
