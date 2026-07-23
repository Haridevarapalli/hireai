'use server';

import { db } from '@/db';
import { resumes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Simulates parsing a resume. In production, this would call an NLP/LLM API.
export async function uploadResume(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  const file = formData.get('file') as File;
  if (!file) return { error: 'No file uploaded' };

  try {
    // 1. Delete any existing resume for this user
    await db.delete(resumes).where(eq(resumes.userId, session.userId));

    // 2. Generate simulated parsed data based on the user's name
    const mockSkills = JSON.stringify([
      "React", "TypeScript", "Node.js", "Python", "SQL", "Tailwind CSS", "Next.js", "Docker"
    ]);
    
    const mockEducation = JSON.stringify([
      {
        degree: "B.Tech in Computer Science",
        college: "Tech University",
        year: "2024",
        score: "8.8 CGPA"
      }
    ]);
    
    const mockProjects = JSON.stringify([
      {
        title: "AI Resume Builder",
        desc: "Built a full-stack AI application for creating optimized resumes using React and Next.js.",
        tech: "React, Next.js, Tailwind, OpenAI"
      },
      {
        title: "E-Commerce Platform",
        desc: "Developed a robust backend architecture for a high-traffic e-commerce platform.",
        tech: "Node.js, Express, PostgreSQL"
      }
    ]);

    const mockCertifications = JSON.stringify([
      { name: "AWS Certified Developer", issuer: "Amazon Web Services" },
      { name: "React Advanced Patterns", issuer: "Meta" }
    ]);

    const resumeObj = {
      extractedName: session.name,
      extractedEmail: session.email || `${session.name.replace(/\s+/g, '').toLowerCase()}@email.com`,
      extractedPhone: "+91 9876543210",
      education: mockEducation,
      skills: mockSkills,
      projects: mockProjects,
      certifications: mockCertifications,
    };

    const { calculateATSScore } = await import('@/utils/scoring');
    const score = calculateATSScore(resumeObj);

    // 3. Save to database
    await db.insert(resumes).values({
      userId: session.userId,
      fileName: file.name,
      ...resumeObj,
      overallScore: score,
      scoreBreakdown: JSON.stringify({
        contact: { score: 10, max: 10 },
        structure: { score: 10, max: 15 },
        education: { score: 10, max: 10 },
        skills: { score: 15, max: 20 },
        projects: { score: 15, max: 20 },
        experience: { score: 5, max: 10 },
        certifications: { score: 5, max: 5 },
        keywordMatch: { score: 5, max: 10 }
      }),
      rawText: "Sample parsed text...",
      feedback: JSON.stringify({
        missingSkills: ["GraphQL", "Kubernetes", "CI/CD"],
        weakSections: ["experience", "structure"],
        strengths: ["Strong modern frontend stack (React, Next.js)", "Good academic background", "Relevant project experience"],
        suggestions: ["Add more quantifiable achievements to your projects", "Include a professional summary", "Flesh out your work experience section with bullet points"]
      }),
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to upload and parse resume' };
  }
}

export async function getResume() {
  const session = await getSession();
  if (!session) return null;

  try {
    const resume = db.select().from(resumes).where(eq(resumes.userId, session.userId)).get();
    return resume || null;
  } catch (err) {
    console.error("Error fetching resume:", err);
    return null;
  }
}

export async function saveATSResult(fileName: string, rawText: string, result: any) {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  try {
    await db.delete(resumes).where(eq(resumes.userId, session.userId));

    await db.insert(resumes).values({
      userId: session.userId,
      fileName: fileName,
      extractedName: result.extracted.name || session.name,
      extractedEmail: result.extracted.email || session.email,
      extractedPhone: result.extracted.phone || "",
      education: JSON.stringify(result.extracted.education || []),
      skills: JSON.stringify(result.extracted.skills || []),
      projects: JSON.stringify(result.extracted.projects || []),
      certifications: JSON.stringify(result.extracted.certifications || []),
      overallScore: result.overallScore,
      scoreBreakdown: JSON.stringify(result.breakdown),
      rawText: rawText,
      feedback: JSON.stringify(result.feedback),
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to save ATS results' };
  }
}
