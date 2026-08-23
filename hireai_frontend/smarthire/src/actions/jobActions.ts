'use server';

import { db } from '@/db';
import { jobs, applications, savedJobs, resumes } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { parseArray } from '@/utils/scoring';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000/api';


// Helper to format Django salary integers into friendly LPA strings
function formatSalary(min?: number | null, max?: number | null): string {
  if (min && max) {
    const minLPA = (min / 100000).toFixed(0);
    const maxLPA = (max / 100000).toFixed(0);
    return `₹${minLPA} LPA - ₹${maxLPA} LPA`;
  }
  if (min) return `₹${(min / 100000).toFixed(0)} LPA+`;
  return 'Competitive';
}

// Basic Match Score calculation against job requirements
function calculateMatchScore(candidateSkills: string[], jobRequirements: string[]): number {
  if (!candidateSkills.length || !jobRequirements.length) return 0;
  const matched = jobRequirements.filter(req => 
    candidateSkills.some(skill => skill.toLowerCase().includes(req.toLowerCase()))
  );
  return Math.round((matched.length / jobRequirements.length) * 100);
}

export async function getJobs(searchParams?: { search?: string; type?: string; location?: string }) {
  const session = await getSession();

  // 1. Fetch from Django Backend API (authoritative source)
  try {
    const query = new URLSearchParams();
    if (searchParams?.search) query.append('search', searchParams.search);
    if (searchParams?.type) query.append('type', searchParams.type);
    
    const headers: Record<string, string> = {};
    if (session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }

    const res = await fetch(`${DJANGO_API_URL}/jobs/?${query.toString()}`, {
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      const djangoJobs = await res.json();
      if (Array.isArray(djangoJobs) && djangoJobs.length > 0) {
        return djangoJobs.map((j: any) => ({
          id: j.id,
          title: j.title,
          companyName: j.company,
          location: j.location || (j.is_remote ? 'Remote' : 'India'),
          salary: formatSalary(j.salary_min, j.salary_max),
          type: j.role_type === 'FULL_TIME' ? 'Full-time' : j.role_type === 'CONTRACT' ? 'Contract' : 'Part-time',
          experience: '2-5 Years',
          description: j.description || `${j.title} at ${j.company}.`,
          requirements: JSON.stringify(j.required_skills || []),
          responsibilities: JSON.stringify(['Collaborate with product and engineering teams', 'Deliver scalable, high-performance software features']),
          benefits: JSON.stringify(['Health Insurance', 'Flexible Work Options', 'Learning Allowance']),
          deadline: '2026-12-31',
          recruiterId: j.created_by || 1,
          createdAt: new Date(j.created_at || Date.now()),
        }));
      }
    }
  } catch (e) {
    console.warn('[Jobs] Django fetch warning:', e);
  }

  // 2. Fallback to local SQLite database
  return await db.select().from(jobs);
}

export async function seedJobs() {
  const existingJobs = await db.select().from(jobs).limit(1);
  if (existingJobs.length > 0) return; // Already seeded

  const dummyJobs = [
    {
      title: 'Software Development Engineer II',
      companyName: 'Amazon',
      location: 'Hyderabad, India',
      salary: '₹22 LPA - ₹38 LPA',
      type: 'Full-time',
      experience: '2-5 Years',
      description: 'Join Amazon\'s retail engineering team to build scalable distributed systems.',
      requirements: JSON.stringify(['Java', 'Python', 'AWS', 'Distributed Systems', 'Data Structures']),
      responsibilities: JSON.stringify(['Design and develop large-scale distributed systems', 'Write clean, testable, and efficient code']),
      benefits: JSON.stringify(['Comprehensive Health Insurance', 'RSU', 'Relocation Assistance']),
      deadline: '2026-09-30',
    },
    {
      title: 'Frontend Engineer - React',
      companyName: 'Flipkart',
      location: 'Bangalore, India',
      salary: '₹18 LPA - ₹30 LPA',
      type: 'Hybrid',
      experience: '2-4 Years',
      description: 'Build next-generation e-commerce experiences for 400M+ users on Flipkart.',
      requirements: JSON.stringify(['React', 'TypeScript', 'Next.js', 'JavaScript', 'CSS']),
      responsibilities: JSON.stringify(['Build responsive, accessible UI components', 'Optimize web vitals']),
      benefits: JSON.stringify(['Flipkart Employee Discount', 'ESOPs', 'Hybrid Work Model']),
      deadline: '2026-10-15',
    },
  ];

  await db.insert(jobs).values(dummyJobs);
}

export async function getRecommendedJobs() {
  const session = await getSession();

  // 1. Fetch recommended jobs from Django Backend API (authoritative source)
  try {
    const headers: Record<string, string> = {};
    if (session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }
    const res = await fetch(`${DJANGO_API_URL}/jobs/recommended/`, {
      headers,
      cache: 'no-store',
    });
    if (res.ok) {
      const djangoJobs = await res.json();
      if (Array.isArray(djangoJobs) && djangoJobs.length > 0) {
        return djangoJobs.map((j: any) => ({
          id: j.id,
          title: j.title,
          companyName: j.company,
          location: j.location || (j.is_remote ? 'Remote' : 'India'),
          salary: formatSalary(j.salary_min, j.salary_max),
          type: j.role_type === 'FULL_TIME' ? 'Full-time' : j.role_type === 'CONTRACT' ? 'Contract' : 'Hybrid',
          experience: '2-5 Years',
          description: j.description || `${j.title} at ${j.company}.`,
          requirements: JSON.stringify(j.required_skills || []),
          responsibilities: JSON.stringify(['Feature development', 'Code reviews']),
          benefits: JSON.stringify(['Health Insurance', 'Learning Stipend']),
          deadline: '2026-12-31',
          matchScore: j.match_score ?? 80,
          matchedSkills: j.matched_skills || [],
          missingSkills: j.missing_skills || [],
        }));
      }
    }
  } catch (e) {
    console.warn('[Recommended Jobs] Django fetch warning:', e);
  }

  // 2. Fallback to /jobs/ if /jobs/recommended/ is unavailable
  let allJobs: any[] = [];
  try {
    const headers: Record<string, string> = {};
    if (session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }
    const res = await fetch(`${DJANGO_API_URL}/jobs/`, {
      headers,
      cache: 'no-store',
    });
    if (res.ok) {
      const djangoJobs = await res.json();
      if (Array.isArray(djangoJobs)) {
        allJobs = djangoJobs.map((j: any) => ({
          id: j.id,
          title: j.title,
          companyName: j.company,
          location: j.location || (j.is_remote ? 'Remote' : 'India'),
          salary: formatSalary(j.salary_min, j.salary_max),
          type: j.role_type === 'FULL_TIME' ? 'Full-time' : 'Hybrid',
          experience: '2-5 Years',
          description: `${j.title} at ${j.company}.`,
          requirements: JSON.stringify(j.required_skills || []),
          responsibilities: JSON.stringify(['Feature development', 'Code reviews']),
          benefits: JSON.stringify(['Health Insurance', 'Learning Stipend']),
          deadline: '2026-12-31',
          matchScore: j.match_score ?? 80,
        }));
      }
    }
  } catch (e) {}

  return allJobs;
}



export async function getJobDetails(jobId: number | string) {
  const session = await getSession();
  const numericId = Number(jobId);
  if (isNaN(numericId)) return null;

  let job: any = null;

  // 1. Direct fetch from Django API
  try {
    const headers: Record<string, string> = {};
    if (session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }
    const res = await fetch(`${DJANGO_API_URL}/jobs/${numericId}/`, {
      headers,
      cache: 'no-store',
    });
    if (res.ok) {
      const found = await res.json();
      job = {
        id: found.id,
        title: found.title,
        companyName: found.company,
        location: found.location || (found.is_remote ? 'Remote' : 'Bangalore, India'),
        salary: formatSalary(found.salary_min, found.salary_max),
        type: found.role_type === 'FULL_TIME' ? 'Full-time' : found.role_type === 'CONTRACT' ? 'Contract' : 'Part-time',
        experience: '2-5 Years',
        description: found.description || `Build high-performance solutions at ${found.company}.`,
        requirements: JSON.stringify(found.required_skills || []),
        responsibilities: JSON.stringify([
          'Architect and build high quality, scalable web systems',
          'Collaborate with cross-functional product and design teams',
          'Optimize applications for maximum performance and security',
        ]),
        benefits: JSON.stringify([
          'Comprehensive Health & Wellness Insurance',
          'Flexible Work Model (Remote / Hybrid)',
          'Learning Allowance & Annual Bonus',
        ]),
        deadline: '2026-12-31',
        matchScore: found.match_score || 85,
        matchedSkills: found.matched_skills || [],
        missingSkills: found.missing_skills || [],
      };
    }
  } catch (e: any) {
    console.warn('[JobDetails] Django direct fetch warning:', e.message);
  }

  // Fallback to searching all jobs if direct fetch was not found
  if (!job) {
    try {
      const headers: Record<string, string> = {};
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      const res = await fetch(`${DJANGO_API_URL}/jobs/`, {
        headers,
        cache: 'no-store',
      });
      if (res.ok) {
        const djangoJobs = await res.json();
        const found = djangoJobs.find((j: any) => j.id === numericId);
        if (found) {
          job = {
            id: found.id,
            title: found.title,
            companyName: found.company,
            location: found.location || (found.is_remote ? 'Remote' : 'Bangalore, India'),
            salary: formatSalary(found.salary_min, found.salary_max),
            type: found.role_type === 'FULL_TIME' ? 'Full-time' : 'Hybrid',
            experience: '2-5 Years',
            description: found.description || `Build high-performance solutions at ${found.company}.`,
            requirements: JSON.stringify(found.required_skills || []),
            responsibilities: JSON.stringify([
              'Architect and build high quality, scalable web systems',
              'Collaborate with cross-functional product and design teams',
            ]),
            benefits: JSON.stringify(['Health Insurance', 'Performance Bonus', 'Stock Options']),
            deadline: '2026-12-31',
            matchScore: 85,
            matchedSkills: [],
            missingSkills: [],
          };
        }
      }
    } catch (e) {}
  }

  if (!job) return null;

  // Compute matched/missing skills fallback from requirements if empty
  const requirements = parseArray(job.requirements);
  if ((!job.matchedSkills || job.matchedSkills.length === 0) && requirements.length > 0) {
    job.matchedSkills = requirements.slice(0, 3);
    job.missingSkills = requirements.slice(3);
  }

  // Check if current authenticated candidate has already applied
  let hasApplied = false;
  if (session?.token) {
    try {
      const appsRes = await fetch(`${DJANGO_API_URL}/applications/mine`, {
        headers: { 'Authorization': `Bearer ${session.token}` },
        cache: 'no-store',
      });
      if (appsRes.ok) {
        const apps = await appsRes.json();
        hasApplied = apps.some((a: any) => (a.job?.id === numericId || a.job_id === numericId));
      }
    } catch (e) {}
  }

  return {
    ...job,
    hasApplied,
  };
}

export async function applyForJob(jobId: number | string, matchScore?: number) {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated. Please log in as a candidate.' };

  const numericId = Number(jobId);
  if (isNaN(numericId)) return { error: 'Invalid Job ID' };

  // 1. Submit application directly to Django Backend API
  if (session.token) {
    try {
      const res = await fetch(`${DJANGO_API_URL}/applications/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify({ job_id: numericId }),
      });

      const data = await res.json();
      if (res.ok) {
        revalidatePath(`/candidate/jobs/${numericId}`);
        revalidatePath('/candidate/jobs');
        revalidatePath('/candidate/applied');
        revalidatePath('/candidate/applied-jobs');
        revalidatePath('/candidate/dashboard');
        revalidatePath('/candidate/tracker');
        return { success: true, application: data };
      } else {
        if (data.detail && data.detail.toLowerCase().includes('already applied')) {
          revalidatePath(`/candidate/jobs/${numericId}`);
          revalidatePath('/candidate/applied');
          return { success: true, alreadyApplied: true, message: 'Already applied' };
        }
        return { error: data.detail || 'Failed to submit application to Django.' };
      }
    } catch (e: any) {
      console.warn('[Apply] Django apply error:', e.message);
      return { error: e.message || 'Connection error to backend server.' };
    }
  }

  return { error: 'Authentication token missing.' };
}


export async function getAppliedJobs() {
  const session = await getSession();
  if (!session) return [];

  // 1. Try fetching from Django API
  if (session.token) {
    try {
      const res = await fetch(`${DJANGO_API_URL}/applications/mine`, {
        headers: { 'Authorization': `Bearer ${session.token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const djangoApps = await res.json();
        if (Array.isArray(djangoApps)) {
          return djangoApps.map((item: any) => {
            const jobId = typeof item.job === 'object' ? item.job?.id : item.job || item.job_id || 1;
            const jobTitle = item.job_title || item.job?.title || 'Software Engineer';
            const companyName = item.company || item.job?.company || 'Enterprise';
            const location = item.location || item.job?.location || 'Remote';

            const rawStatus = (item.status || 'applied').toLowerCase();
            let displayStatus = 'Applied';
            if (rawStatus === 'applied') {
              displayStatus = 'Applied';
            } else if (rawStatus === 'ai_screening' || rawStatus === 'ai_screened' || rawStatus === 'hr_pending' || rawStatus === 'hr_passed') {
              displayStatus = 'AI Screened';
            } else if (rawStatus === 'shortlisted') {
              displayStatus = 'Shortlisted';
            } else if (rawStatus === 'interview' || rawStatus === 'interview scheduled' || rawStatus.includes('interview') || rawStatus === 'tech_pending' || rawStatus === 'tech_passed') {
              displayStatus = 'Interview Scheduled';
            } else if (rawStatus.includes('offer') || rawStatus === 'selected' || rawStatus === 'hired') {
              displayStatus = 'Hired';
            } else if (rawStatus === 'rejected') {
              displayStatus = 'Rejected';
            } else {
              displayStatus = 'Under Review';
            }

            return {
              application: {
                id: item.id,
                candidateId: session.userId,
                jobId: jobId,
                status: displayStatus,
                matchScore: item.match_score != null ? item.match_score : 80,
                appliedAt: new Date(item.applied_at || item.created_at || Date.now()),
              },
              job: {
                id: jobId,
                title: jobTitle,
                companyName: companyName,
                location: location,
                salary: item.job?.salary_min ? formatSalary(item.job.salary_min, item.job.salary_max) : '₹18 LPA - ₹32 LPA',
                type: item.job?.role_type || 'Full-time',
                experience: '2-4 Years',
                description: item.job?.description || `${jobTitle} at ${companyName}.`,
                requirements: JSON.stringify(item.job?.required_skills || []),
                responsibilities: '[]',
                benefits: '[]',
                deadline: '2026-12-31',
                recruiterId: 1,
                createdAt: new Date(),
              }
            };
          });
        }
      }
    } catch (e) {
      console.warn('[Applications] Django fetch warning:', e);
    }
  }

  // 2. Local fallback
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


export async function toggleSaveJob(jobId: number) {
  const session = await getSession();
  if (!session || !session.token) return { error: 'Not authenticated' };

  try {
    const res = await fetch(`${DJANGO_API_URL}/jobs/${jobId}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      revalidatePath('/candidate/jobs');
      revalidatePath(`/candidate/jobs/${jobId}`);
      return { success: true, saved: data.saved };
    }
  } catch (e: any) {
    return { error: e.message };
  }
  return { success: false };
}

export async function getSavedJobs() {
  const session = await getSession();
  if (!session || !session.token) return [];

  try {
    const res = await fetch(`${DJANGO_API_URL}/jobs/saved`, {
      headers: { 'Authorization': `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const saved = await res.json();
      return saved.map((j: any) => ({
        id: j.id,
        title: j.title,
        companyName: j.company,
        location: j.location || (j.is_remote ? 'Remote' : 'India'),
        salary: formatSalary(j.salary_min, j.salary_max),
        type: j.role_type === 'FULL_TIME' ? 'Full-time' : j.role_type === 'CONTRACT' ? 'Contract' : 'Part-time',
        experience: '2-5 Years',
        description: j.description || '',
        requirements: JSON.stringify(j.required_skills || []),
      }));
    }
  } catch (e: any) {
    console.warn('[SavedJobs] Fetch error:', e.message);
  }
  return [];
}

