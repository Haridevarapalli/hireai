
export const parseArray = (val: any) => {
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return Array.isArray(val) ? val : [];
};
export function calculateATSScore(resume: any) {
  if (!resume) return 0;
  let score = 0;

  // Base scoring on presence of fields
  if (resume.extractedName) score += 10;
  if (resume.extractedEmail) score += 10;
  if (resume.extractedPhone) score += 10;

  try {
    const education = parseArray(resume.education);
    if (education.length > 0) score += 20;
  } catch (e) {}

  try {
    const skills = parseArray(resume.skills);
    if (skills.length > 0) score += 20;
    if (skills.length > 5) score += 5; // Bonus for many skills
  } catch (e) {}

  try {
    const projects = parseArray(resume.projects);
    if (projects.length > 0) score += 15;
    if (projects.length > 1) score += 5; // Bonus for multiple projects
  } catch (e) {}

  try {
    const certs = parseArray(resume.certifications);
    if (certs.length > 0) score += 5;
  } catch (e) {}

  return Math.min(score, 100);
}

export function calculateMatchScore(resumeSkillsStr: string | null, targetRoleSkills: string[]) {
  if (!resumeSkillsStr) return { percentage: 0, matched: [], missing: targetRoleSkills };
  
  let resumeSkills: string[] = [];
  try {
    resumeSkills = parseArray(resumeSkillsStr).map((s: string) => s.toLowerCase());
  } catch (e) {
    return { percentage: 0, matched: [], missing: targetRoleSkills };
  }

  const matched = targetRoleSkills.filter(skill => resumeSkills.includes(skill.toLowerCase()));
  const missing = targetRoleSkills.filter(skill => !resumeSkills.includes(skill.toLowerCase()));
  const percentage = Math.round((matched.length / targetRoleSkills.length) * 100) || 0;

  return { percentage, matched, missing };
}

const PROGRAMMING_LANGUAGES = ['java', 'python', 'c++', 'c#', 'javascript', 'typescript', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'php'];
const FRAMEWORKS = ['react', 'angular', 'vue', 'spring', 'django', 'flask', 'express', 'node.js', 'next.js', 'tailwind css', 'bootstrap', 'laravel'];
const DATABASES = ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'cassandra', 'dynamodb', 'firebase'];

export function generateRadarData(resume: any) {
  if (!resume) {
    return [
      { category: "Programming", score: 0 },
      { category: "Frameworks", score: 0 },
      { category: "Databases", score: 0 },
      { category: "Projects", score: 0 },
      { category: "Experience", score: 0 },
      { category: "Certifications", score: 0 },
    ];
  }

  let progScore = 0, frameScore = 0, dbScore = 0, projScore = 0, expScore = 0, certScore = 0;
  
  try {
    const skills = parseArray(resume.skills).map((s: string) => s.toLowerCase());
    
    const progCount = skills.filter((s: string) => PROGRAMMING_LANGUAGES.includes(s)).length;
    const frameCount = skills.filter((s: string) => FRAMEWORKS.includes(s)).length;
    const dbCount = skills.filter((s: string) => DATABASES.includes(s)).length;

    progScore = Math.min(100, progCount * 30 + 10);
    frameScore = Math.min(100, frameCount * 25 + 10);
    dbScore = Math.min(100, dbCount * 35 + 10);

    // If there are skills that don't fall into the hardcoded lists, give some generic points
    if (progScore === 0 && skills.length > 0) progScore = Math.min(100, skills.length * 15);
  } catch(e) {}

  try {
    const projects = parseArray(resume.projects);
    projScore = Math.min(100, projects.length * 35 + 20);
  } catch(e) {}

  try {
    // We don't have an experience column yet in schema, using dummy based on projects/skills
    // In future, you'd parse actual work experience
    const projects = parseArray(resume.projects);
    expScore = Math.min(100, projects.length * 20 + 30);
  } catch(e) {}

  try {
    const certs = parseArray(resume.certifications);
    certScore = Math.min(100, certs.length * 40 + 20);
  } catch(e) {}

  return [
    { category: "Programming", score: progScore },
    { category: "Frameworks", score: frameScore },
    { category: "Databases", score: dbScore },
    { category: "Projects", score: projScore },
    { category: "Experience", score: expScore },
    { category: "Certifications", score: certScore },
  ];
}
