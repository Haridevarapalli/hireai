import * as schema from './schema';

let dbInstance: any = null;

if (typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require('drizzle-orm/better-sqlite3');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const sqlite = new Database(path.join(process.cwd(), 'smarthire.db'));
    dbInstance = drizzle(sqlite, { schema });
  } catch (e) {
    // SQLite not available in static export / browser
  }
}

export const db = dbInstance;
