const Database = require('better-sqlite3');
const db = new Database('./smarthire.db');

db.exec(`
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  title TEXT NOT NULL, 
  company_name TEXT NOT NULL, 
  location TEXT NOT NULL, 
  salary TEXT NOT NULL, 
  type TEXT NOT NULL, 
  experience TEXT NOT NULL, 
  description TEXT NOT NULL, 
  requirements TEXT NOT NULL, 
  responsibilities TEXT NOT NULL, 
  benefits TEXT NOT NULL, 
  deadline TEXT NOT NULL, 
  recruiter_id INTEGER, 
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  candidate_id INTEGER NOT NULL, 
  job_id INTEGER NOT NULL, 
  status TEXT NOT NULL DEFAULT 'Applied', 
  match_score INTEGER, 
  applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS saved_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  candidate_id INTEGER NOT NULL, 
  job_id INTEGER NOT NULL, 
  saved_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
`);

console.log('Tables created successfully');
