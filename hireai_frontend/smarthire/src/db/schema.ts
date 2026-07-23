import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // hashed
  role: text('role', { enum: ['candidate', 'recruiter'] }).notNull(),
  companyName: text('company_name'), // for recruiters
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const resumes = sqliteTable('resumes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  fileName: text('file_name'),
  extractedName: text('extracted_name'),
  extractedEmail: text('extracted_email'),
  extractedPhone: text('extracted_phone'),
  education: text('education', { mode: 'json' }), // Array of strings
  skills: text('skills', { mode: 'json' }), // Array of strings
  projects: text('projects', { mode: 'json' }), // Array of strings
  certifications: text('certifications', { mode: 'json' }), // Array of strings
  overallScore: integer('overall_score'),
  scoreBreakdown: text('score_breakdown', { mode: 'json' }),
  feedback: text('feedback', { mode: 'json' }),
  rawText: text('raw_text'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const jobs = sqliteTable('jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  companyName: text('company_name').notNull(),
  location: text('location').notNull(),
  salary: text('salary').notNull(),
  type: text('type').notNull(), // Full-time, Remote, etc.
  experience: text('experience').notNull(),
  description: text('description').notNull(),
  requirements: text('requirements', { mode: 'json' }).notNull(), // Array of skills
  responsibilities: text('responsibilities', { mode: 'json' }).notNull(),
  benefits: text('benefits', { mode: 'json' }).notNull(),
  deadline: text('deadline').notNull(),
  recruiterId: integer('recruiter_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const applications = sqliteTable('applications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  candidateId: integer('candidate_id').notNull().references(() => users.id),
  jobId: integer('job_id').notNull().references(() => jobs.id),
  status: text('status', { enum: ['Applied', 'Under Review', 'AI Screened', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'] }).notNull().default('Applied'),
  matchScore: integer('match_score'),
  appliedAt: integer('applied_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const savedJobs = sqliteTable('saved_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  candidateId: integer('candidate_id').notNull().references(() => users.id),
  jobId: integer('job_id').notNull().references(() => jobs.id),
  savedAt: integer('saved_at', { mode: 'timestamp' }).notNull().default(new Date()),
});
