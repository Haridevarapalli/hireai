const Database = require('better-sqlite3');
const db = new Database('./smarthire.db');

const candidateId = 9999;

try {
  console.log('Seeding user...');
  const stmtUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmtUser.run(candidateId, 'Demo Candidate', 'demo@candidate.com', 'hashedpassword', 'candidate');

  // 1. Seed some Jobs
  console.log('Seeding jobs...');
  const stmtJob = db.prepare(`
    INSERT INTO jobs (title, company_name, location, salary, type, experience, description, requirements, responsibilities, benefits, deadline, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const jobsToInsert = [
    ['Senior React Developer', 'TechNova', 'Remote', '₹20-30 LPA', 'Full-time', '4-6 Years', 'Great company.', JSON.stringify(['React', 'TypeScript', 'Node.js']), '[]', '[]', '2026-12-31', Date.now()],
    ['Backend Engineer', 'InnovateX', 'Bangalore', '₹18-25 LPA', 'Hybrid', '3-5 Years', 'Build APIs.', JSON.stringify(['Python', 'Django', 'SQL']), '[]', '[]', '2026-11-15', Date.now()],
    ['Full Stack Developer', 'StartupHub', 'Pune', '₹15-22 LPA', 'Full-time', '2-4 Years', 'Fast paced.', JSON.stringify(['React', 'Node.js', 'PostgreSQL']), '[]', '[]', '2026-10-30', Date.now()],
    ['Frontend Architect', 'MegaSoft', 'Hyderabad', '₹35-50 LPA', 'Full-time', '8+ Years', 'Lead UI.', JSON.stringify(['React', 'Next.js', 'System Design']), '[]', '[]', '2026-12-01', Date.now()]
  ];

  const jobIds = [];
  for (const job of jobsToInsert) {
    const info = stmtJob.run(...job);
    jobIds.push(info.lastInsertRowid);
  }

  // 2. Seed Applications
  console.log('Seeding applications...');
  const stmtApp = db.prepare(`
    INSERT INTO applications (candidate_id, job_id, status, match_score, applied_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmtApp.run(candidateId, jobIds[0], 'Shortlisted', 92, Date.now() - 86400000 * 2);
  stmtApp.run(candidateId, jobIds[1], 'Interview Scheduled', 88, Date.now() - 86400000 * 5);
  stmtApp.run(candidateId, jobIds[2], 'Applied', 75, Date.now() - 86400000 * 1);

  // 3. Seed Resume
  console.log('Seeding resume...');
  const stmtResume = db.prepare(`
    INSERT INTO resumes (user_id, file_name, extracted_name, extracted_email, extracted_phone, education, skills, projects, certifications, overall_score, score_breakdown, feedback, raw_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const skills = JSON.stringify(['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'HTML', 'CSS', 'JavaScript']);
  const edu = JSON.stringify(['B.Tech in Computer Science']);
  const proj = JSON.stringify(['E-commerce Platform', 'Chat App']);
  const certs = JSON.stringify(['AWS Certified Developer']);

  stmtResume.run(
    candidateId, 
    'demo_resume.pdf', 
    'Demo Candidate', 
    'demo@candidate.com', 
    '+91-9876543210', 
    edu, 
    skills, 
    proj, 
    certs, 
    85, 
    '{}', 
    'Good resume!', 
    'Raw text representation of resume'
  );

  console.log('Candidate data seeded successfully!');
} catch (e) {
  console.error('Error seeding data:', e);
}
