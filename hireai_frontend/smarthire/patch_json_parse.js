const fs = require('fs');
const path = require('path');

const safeParseFn = `
export const parseArray = (val: any) => {
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return Array.isArray(val) ? val : [];
};
`;

const filesToUpdate = [
  'src/utils/scoring.ts',
  'src/actions/jobActions.ts',
  'src/app/candidate/(dashboard)/profile/page.tsx',
  'src/app/candidate/(dashboard)/jobs/[id]/page.tsx'
];

function patchFile(file) {
  const fullPath = path.join(__dirname, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  if (file === 'src/utils/scoring.ts') {
    if (!content.includes('export const parseArray')) {
      content = safeParseFn + content;
    }
  } else {
    if (!content.includes('parseArray')) {
      // Add import
      if (file.includes('jobActions.ts')) {
        content = content.replace("import { revalidatePath } from 'next/cache';", "import { revalidatePath } from 'next/cache';\nimport { parseArray } from '@/utils/scoring';");
      } else if (file.includes('profile/page.tsx')) {
        content = content.replace("import { calculateATSScore } from \"@/utils/scoring\";", "import { calculateATSScore, parseArray } from \"@/utils/scoring\";");
      } else if (file.includes('jobs/[id]/page.tsx')) {
        content = content.replace("import { applyForJob, getJobDetails } from \"@/actions/jobActions\";", "import { applyForJob, getJobDetails } from \"@/actions/jobActions\";\nimport { parseArray } from '@/utils/scoring';");
      }
    }
  }

  // Common replacements
  content = content.replace(/JSON\.parse\((resume\.education)\s*\|\|\s*['"]\[\]['"]\)/g, 'parseArray($1)');
  content = content.replace(/JSON\.parse\((resume\.skills)\s*\|\|\s*['"]\[\]['"]\)/g, 'parseArray($1)');
  content = content.replace(/JSON\.parse\((resume\.projects)\s*\|\|\s*['"]\[\]['"]\)/g, 'parseArray($1)');
  content = content.replace(/JSON\.parse\((resume\.certifications)\s*\|\|\s*['"]\[\]['"]\)/g, 'parseArray($1)');
  
  content = content.replace(/JSON\.parse\((job\.requirements)\s*\|\|\s*['"]\[\]['"]\)/g, 'parseArray($1)');
  content = content.replace(/JSON\.parse\((job\.responsibilities)\s*\|\|\s*['"]\[\]['"]\)/g, 'parseArray($1)');
  content = content.replace(/JSON\.parse\((job\.benefits)\s*\|\|\s*['"]\[\]['"]\)/g, 'parseArray($1)');
  content = content.replace(/JSON\.parse\((candidateResume\.skills)\s*\|\|\s*['"]\[\]['"]\)/g, 'parseArray($1)');
  
  // Specific to profile/page.tsx
  content = content.replace(/JSON\.parse\(resume\.skills\)/g, 'parseArray(resume.skills)');
  content = content.replace(/JSON\.parse\(resume\.education\)/g, 'parseArray(resume.education)');
  content = content.replace(/JSON\.parse\(resume\.projects\)/g, 'parseArray(resume.projects)');
  content = content.replace(/JSON\.parse\(resume\.certifications\)/g, 'parseArray(resume.certifications)');
  
  // Specific to scoring.ts
  content = content.replace(/JSON\.parse\(resumeSkillsStr\)/g, 'parseArray(resumeSkillsStr)');

  fs.writeFileSync(fullPath, content);
  console.log('Updated ' + file);
}

filesToUpdate.forEach(patchFile);
