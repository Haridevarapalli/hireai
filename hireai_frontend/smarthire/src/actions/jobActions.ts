'use server';

import { db } from '@/db';
import { jobs, applications, savedJobs, resumes } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { parseArray } from '@/utils/scoring';

// Basic Match Score calculation against job requirements
function calculateMatchScore(candidateSkills: string[], jobRequirements: string[]): number {
  if (!candidateSkills.length || !jobRequirements.length) return 0;
  const matched = jobRequirements.filter(req => 
    candidateSkills.some(skill => skill.toLowerCase().includes(req.toLowerCase()))
  );
  return Math.round((matched.length / jobRequirements.length) * 100);
}

export async function seedJobs() {
  const existingJobs = await db.select().from(jobs).limit(1);
  if (existingJobs.length > 0) return; // Already seeded

  const dummyJobs = [
    {
      title: 'Full Stack Developer',
      companyName: 'TechNova Solutions',
      location: 'Hyderabad, India',
      salary: '₹12 LPA - ₹18 LPA',
      type: 'Full-time',
      experience: '2-5 Years',
      description: 'We are looking for a highly skilled Full Stack Developer to build and maintain scalable web applications.',
      requirements: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL']),
      responsibilities: JSON.stringify(['Develop user-facing features using React', 'Build robust backend APIs using Node.js', 'Design database schemas']),
      benefits: JSON.stringify(['Health Insurance', 'Remote Work Options', 'Annual Bonus']),
      deadline: '2026-12-31',
    },
    {
      title: 'Frontend Developer',
      companyName: 'InnovateX',
      location: 'Bangalore, India',
      salary: '₹8 LPA - ₹14 LPA',
      type: 'Hybrid',
      experience: '1-3 Years',
      description: 'Seeking a creative Frontend Developer to craft beautiful and responsive user interfaces.',
      requirements: JSON.stringify(['React', 'Next.js', 'Tailwind CSS', 'JavaScript']),
      responsibilities: JSON.stringify(['Translate UI/UX designs to code', 'Optimize application for maximum speed', 'Collaborate with backend developers']),
      benefits: JSON.stringify(['Flexible Hours', 'Gym Membership', 'Stock Options']),
      deadline: '2026-11-15',
    },
    {
      title: 'Backend Engineer',
      companyName: 'CloudScale Inc',
      location: 'Remote',
      salary: '₹15 LPA - ₹25 LPA',
      type: 'Remote',
      experience: '4+ Years',
      description: 'Join our core platform team to build highly available microservices.',
      requirements: JSON.stringify(['Python', 'Docker', 'AWS', 'SQL', 'Kubernetes']),
      responsibilities: JSON.stringify(['Architect microservices', 'Maintain CI/CD pipelines', 'Optimize database queries']),
      benefits: JSON.stringify(['Home Office Stipend', 'Unlimited PTO', '401k Match']),
      deadline: '2026-10-30',
    }
  ];

  await db.insert(jobs).values(dummyJobs);
}

export async function getRecommendedJobs() {
  const session = await getSession();
  if (!session) return [];

  // 1. Fetch all jobs
  const allJobs = await db.select().from(jobs);
  
  // 2. Fetch candidate resume
  const candidateResume = await db.select().from(resumes).where(eq(resumes.userId, session.userId)).get();
  
  const candidateSkills = candidateResume ? parseArray(candidateResume.skills) : [];

  // 3. Map match scores
  const jobsWithMatch = allJobs.map(job => {
    const requirements = parseArray(job.requirements);
    const matchScore = calculateMatchScore(candidateSkills, requirements);
    return { ...job, matchScore };
  });

  // 4. Sort by match score
  return jobsWithMatch.sort((a, b) => b.matchScore - a.matchScore);
}

export async function getJobDetails(jobId: number) {
  const session = await getSession();
  if (!session) return null;

  const job = await db.select().from(jobs).where(eq(jobs.id, jobId)).get();
  if (!job) return null;

  const candidateResume = await db.select().from(resumes).where(eq(resumes.userId, session.userId)).get();
  const candidateSkills = candidateResume ? parseArray(candidateResume.skills) : [];
  const requirements = parseArray(job.requirements);
  
  const matchedSkills = requirements.filter((req: string) => 
    candidateSkills.some((skill: string) => skill.toLowerCase().includes(req.toLowerCase()))
  );
  
  const missingSkills = requirements.filter((req: string) => 
    !candidateSkills.some((skill: string) => skill.toLowerCase().includes(req.toLowerCase()))
  );

  const matchScore = calculateMatchScore(candidateSkills, requirements);

  const application = await db.select().from(applications)
    .where(and(eq(applications.jobId, jobId), eq(applications.candidateId, session.userId)))
    .get();

  return {
    ...job,
    matchedSkills,
    missingSkills,
    matchScore,
    hasApplied: !!application
  };
}

export async function applyForJob(jobId: number, matchScore: number) {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  try {
    const existing = await db.select().from(applications)
      .where(and(eq(applications.jobId, jobId), eq(applications.candidateId, session.userId)))
      .get();
      
    if (existing) return { error: 'Already applied' };

    await db.insert(applications).values({
      candidateId: session.userId,
      jobId,
      matchScore,
      status: 'Applied'
    });

    revalidatePath(`/candidate/jobs/${jobId}`);
    revalidatePath('/candidate/applied-jobs');
    revalidatePath('/candidate/dashboard');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getAppliedJobs() {
  const session = await getSession();
  if (!session) return [];

  const userApplications = await db.select({
    application: applications,
    job: jobs
  })
  .from(applications)
  .leftJoin(jobs, eq(applications.jobId, jobs.id))
  .where(eq(applications.candidateId, session.userId))
  .orderBy(desc(applications.appliedAt));

  return userApplications;
}
