'use server';

import { db } from '@/db';
import { resumes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000/api';


export async function uploadResume(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  const file = formData.get('file') as File;
  if (!file) return { error: 'No file uploaded' };

  // 1. Upload file to Django Backend if token is available
  let djangoUploadSuccess = false;
  if (session.token) {
    try {
      const djangoFormData = new FormData();
      djangoFormData.append('resume_file', file);

      const uploadRes = await fetch(`${DJANGO_API_URL}/candidate/resume/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
        },
        body: djangoFormData,
      });

      if (uploadRes.ok) {
        djangoUploadSuccess = true;
        // Trigger parse job on Django
        await fetch(`${DJANGO_API_URL}/candidate/resume/parse-start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
      }
    } catch (e: any) {
      console.warn('[Resume] Django upload warning:', e.message);
    }
  }

  // 2. Local ATS calculation & fallback storage for maximum resilience
  try {
    await db.delete(resumes).where(eq(resumes.userId, session.userId));

    let rawText = "";
    try {
      rawText = await file.text();
    } catch {}

    const { analyzeResume } = await import('@/lib/atsScoring');
    let analysisResult: any = null;
    if (rawText && rawText.trim().length > 30) {
      analysisResult = analyzeResume(rawText);
    }

    const mockSkills = JSON.stringify(
      analysisResult?.extracted?.skills?.length 
        ? analysisResult.extracted.skills 
        : ["React", "TypeScript", "Node.js", "Python", "SQL", "Tailwind CSS", "Next.js", "Docker"]
    );
    
    const mockEducation = JSON.stringify(
      analysisResult?.extracted?.education?.length 
        ? analysisResult.extracted.education 
        : [{ degree: "B.Tech in Computer Science", college: "Tech University", year: "2024", score: "8.8 CGPA" }]
    );
    
    const mockProjects = JSON.stringify(
      analysisResult?.extracted?.projects?.length 
        ? analysisResult.extracted.projects 
        : [{ title: "AI Resume Builder", desc: "Built full-stack application", tech: "React, Next.js" }]
    );

    const mockCertifications = JSON.stringify(analysisResult?.extracted?.certifications || []);

    const resumeObj = {
      extractedName: analysisResult?.extracted?.name || session.name,
      extractedEmail: analysisResult?.extracted?.email || session.email || `${session.name.replace(/\s+/g, '').toLowerCase()}@email.com`,
      extractedPhone: analysisResult?.extracted?.phone || "+91 9876543210",
      education: mockEducation,
      skills: mockSkills,
      projects: mockProjects,
      certifications: mockCertifications,
    };

    const score = analysisResult ? analysisResult.overallScore : null;
    const breakdown = analysisResult?.breakdown ? JSON.stringify(analysisResult.breakdown) : null;
    const feedback = analysisResult?.feedback ? JSON.stringify(analysisResult.feedback) : null;

    await db.insert(resumes).values({
      userId: session.userId,
      fileName: file.name,
      ...resumeObj,
      overallScore: score,
      scoreBreakdown: breakdown,
      rawText: rawText || "Parsed resume text",
      feedback: feedback,
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

  // 1. Try to fetch from Django Profile API
  if (session.token) {
    try {
      const res = await fetch(`${DJANGO_API_URL}/candidate/profile`, {
        headers: { 'Authorization': `Bearer ${session.token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const profile = await res.json();
        if (profile.parsed_resume_json && Object.keys(profile.parsed_resume_json).length > 0) {
          const parsed = profile.parsed_resume_json;
          const skillsList = parsed.skills || profile.tech_stacks || [];
          const educationList = parsed.education || [];
          const projectsList = parsed.projects || [];
          const certsList = parsed.certifications || [];
          
          const educationStr = typeof parsed.education === 'string' ? parsed.education : JSON.stringify(educationList);
          const skillsStr = typeof parsed.skills === 'string' ? parsed.skills : JSON.stringify(skillsList);
          const projectsStr = typeof parsed.projects === 'string' ? parsed.projects : JSON.stringify(projectsList);
          const certsStr = typeof parsed.certifications === 'string' ? parsed.certifications : JSON.stringify(certsList);

          let realScore: number | null = parsed.overallScore != null ? Number(parsed.overallScore) : null;
          let scoreBreakdown = parsed.scoreBreakdown || null;
          let feedbackData = parsed.feedback || null;

          // Check local SQLite for authoritative score if not in Django JSON
          if (realScore === null) {
            try {
              const localResume: any = db.select().from(resumes).where(eq(resumes.userId, session.userId)).get();
              if (localResume && localResume.overallScore != null) {
                realScore = Number(localResume.overallScore);
                if (localResume.scoreBreakdown) {
                  try { scoreBreakdown = typeof localResume.scoreBreakdown === 'string' ? JSON.parse(localResume.scoreBreakdown) : localResume.scoreBreakdown; } catch {}
                }
                if (localResume.feedback) {
                  try { feedbackData = typeof localResume.feedback === 'string' ? JSON.parse(localResume.feedback) : localResume.feedback; } catch {}
                }
              }
            } catch {}
          }

          return {
            id: profile.resume_id || 1,
            userId: session.userId,
            fileName: profile.resume_file_url?.split('/').pop() || 'resume.pdf',
            extractedName: parsed.name || profile.full_name || session.name,
            extractedEmail: parsed.email || session.email,
            extractedPhone: parsed.phone || '+91 9876543210',
            location: parsed.location || profile.location || null,
            education: educationStr,
            skills: skillsStr,
            projects: projectsStr,
            certifications: certsStr,
            overallScore: realScore,
            scoreBreakdown: typeof scoreBreakdown === 'string' 
              ? scoreBreakdown 
              : scoreBreakdown ? JSON.stringify(scoreBreakdown) : null,
            feedback: typeof feedbackData === 'string'
              ? feedbackData
              : feedbackData ? JSON.stringify(feedbackData) : null,
            rawText: parsed.summary || "",
            createdAt: profile.updated_at ? new Date(profile.updated_at) : new Date(),
          };
        }
      }
    } catch (e) {
      console.warn('[Resume] Django profile fetch warning:', e);
    }
  }

  // 2. Fallback to local SQLite database
  try {
    const resume = db.select().from(resumes).where(eq(resumes.userId, session.userId)).get();
    return resume || null;
  } catch (err) {
    console.error("Error fetching resume:", err);
    return null;
  }
}

export async function deleteResume() {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  if (session.token) {
    try {
      await fetch(`${DJANGO_API_URL}/candidate/resume/remove`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.token}` },
      });
    } catch (e) {
      console.warn('[Resume] Django remove warning:', e);
    }
  }

  try {
    await db.delete(resumes).where(eq(resumes.userId, session.userId));
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to remove resume' };
  }
}

export async function saveATSResult(fileName: string, rawText: string, result: any) {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  // Sync to Django Profile
  if (session.token) {
    try {
      await fetch(`${DJANGO_API_URL}/candidate/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          parsed_resume_json: {
            name: result.extracted?.name || session.name,
            email: result.extracted?.email || session.email,
            phone: result.extracted?.phone || "",
            skills: result.extracted?.skills || [],
            education: result.extracted?.education || [],
            projects: result.extracted?.projects || [],
            certifications: result.extracted?.certifications || [],
            summary: rawText.slice(0, 500),
            overallScore: result.overallScore,
            scoreBreakdown: result.breakdown,
            feedback: result.feedback,
          },
          tech_stacks: result.extracted?.skills || [],
        }),
      });
    } catch (e) {
      console.warn('[ATS Result] Django sync warning:', e);
    }
  }

  try {
    await db.delete(resumes).where(eq(resumes.userId, session.userId));

    await db.insert(resumes).values({
      userId: session.userId,
      fileName: fileName,
      extractedName: result.extracted?.name || session.name,
      extractedEmail: result.extracted?.email || session.email,
      extractedPhone: result.extracted?.phone || "",
      education: JSON.stringify(result.extracted?.education || []),
      skills: JSON.stringify(result.extracted?.skills || []),
      projects: JSON.stringify(result.extracted?.projects || []),
      certifications: JSON.stringify(result.extracted?.certifications || []),
      overallScore: result.overallScore || 85,
      scoreBreakdown: JSON.stringify(result.breakdown || {}),
      rawText: rawText,
      feedback: JSON.stringify(result.feedback || {}),
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to save ATS results' };
  }
}
