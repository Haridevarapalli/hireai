
export const parseArray = (val: any) => {
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return Array.isArray(val) ? val : [];
};

const SKILL_ALIASES: Record<string, string[]> = {
  'js': ['javascript'],
  'javascript': ['js'],
  'ts': ['typescript'],
  'typescript': ['ts'],
  'reactjs': ['react'],
  'react.js': ['react'],
  'react': ['reactjs', 'react.js'],
  'nodejs': ['node.js'],
  'node': ['node.js', 'nodejs'],
  'node.js': ['node', 'nodejs'],
  'nextjs': ['next.js'],
  'next': ['next.js', 'nextjs'],
  'next.js': ['next', 'nextjs'],
  'mysql': ['sql'],
  'postgresql': ['sql', 'postgres'],
  'postgres': ['sql', 'postgresql'],
  'oracle': ['sql'],
  'plsql': ['sql', 'pl/sql'],
  'pl/sql': ['sql', 'plsql'],
  'spring': ['spring boot', 'springboot'],
  'springboot': ['spring boot', 'spring'],
  'spring boot': ['spring', 'springboot'],
  'rest api': ['rest apis', 'restful apis', 'restful api'],
  'rest apis': ['rest api', 'restful apis', 'restful api'],
  'aws': ['amazon web services'],
};

export function normalizeCandidateSkills(skills: string[]): Set<string> {
  const set = new Set<string>();
  for (const s of skills) {
    if (!s || typeof s !== 'string') continue;
    const clean = s.toLowerCase().trim();
    if (!clean) continue;
    set.add(clean);
    if (SKILL_ALIASES[clean]) {
      SKILL_ALIASES[clean].forEach(a => set.add(a.toLowerCase().trim()));
    }
  }
  return set;
}

export function isRequirementMatched(candidateSkillsSet: Set<string>, reqSkill: string): boolean {
  if (!reqSkill || typeof reqSkill !== 'string') return false;
  const cleanReq = reqSkill.toLowerCase().trim();
  if (candidateSkillsSet.has(cleanReq)) return true;
  if (SKILL_ALIASES[cleanReq]) {
    return SKILL_ALIASES[cleanReq].some(a => candidateSkillsSet.has(a.toLowerCase().trim()));
  }
  return false;
}

export function calculateATSScore(resume: any): number {
  if (!resume) return 0;
  if (resume.overallScore != null) return Number(resume.overallScore);
  return 0;
}

export function calculateMatchScore(resumeSkillsStr: string | null | any[], targetRoleSkills: string[]) {
  if (!resumeSkillsStr || !targetRoleSkills || targetRoleSkills.length === 0) {
    return { percentage: 0, matched: [], missing: targetRoleSkills || [] };
  }
  
  let resumeSkills: string[] = [];
  try {
    resumeSkills = parseArray(resumeSkillsStr);
  } catch (e) {
    return { percentage: 0, matched: [], missing: targetRoleSkills };
  }

  const candSet = normalizeCandidateSkills(resumeSkills);
  const matched = targetRoleSkills.filter(req => isRequirementMatched(candSet, req));
  const missing = targetRoleSkills.filter(req => !isRequirementMatched(candSet, req));
  const percentage = targetRoleSkills.length > 0 ? Math.round((matched.length / targetRoleSkills.length) * 100) : 0;

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
