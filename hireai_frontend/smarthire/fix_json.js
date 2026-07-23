const Database = require('better-sqlite3');
const db = new Database('./smarthire.db');

try {
  console.log('Fixing invalid JSON in resumes...');
  const stmt = db.prepare(`UPDATE resumes SET feedback = '\"Good resume!\"' WHERE feedback = 'Good resume!'`);
  stmt.run();
  
  // Let's also check if any other fields are invalid JSON.
  // education, skills, projects, certifications were inserted as JSON.stringify() which is correct for raw better-sqlite3 insert.
  // scoreBreakdown was '{}' which is valid JSON.
  
  console.log('Fixed successfully.');
} catch (e) {
  console.error('Error:', e);
}
