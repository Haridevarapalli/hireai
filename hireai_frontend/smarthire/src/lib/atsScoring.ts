export interface ATSResult {
  overallScore: number;
  breakdown: {
    contact: { score: number; max: number };
    structure: { score: number; max: number };
    education: { score: number; max: number };
    skills: { score: number; max: number };
    projects: { score: number; max: number };
    experience: { score: number; max: number };
    certifications: { score: number; max: number };
    keywordMatch: { score: number; max: number };
  };
  extracted: {
    name: string | null;
    email: string | null;
    phone: string | null;
    skills: string[];
    education: string[];
    projects: string[];
    certifications: string[];
  };
  feedback: {
    missingSkills: string[];
    weakSections: string[];
    strengths: string[];
    suggestions: string[];
  };
}

// Common tech keywords categorized
const techKeywords = {
  languages: ["javascript", "typescript", "python", "java", "c++", "c#", "ruby", "go", "rust", "php", "swift", "kotlin", "sql", "html", "css", "r", "dart"],
  frameworks: ["react", "angular", "vue", "next.js", "node.js", "express", "django", "flask", "spring boot", "ruby on rails", "laravel", "asp.net", "tailwind", "bootstrap"],
  databases: ["mysql", "postgresql", "mongodb", "sqlite", "redis", "oracle", "sql server", "dynamodb", "cassandra", "firebase"],
  tools: ["git", "github", "gitlab", "docker", "kubernetes", "aws", "azure", "gcp", "linux", "jenkins", "jira", "figma", "webpack", "babel", "postman"]
};

// Target roles and their ideal keywords
export const jobRoles = {
  "Software Engineer": ["javascript", "python", "java", "sql", "git", "github", "react", "node.js", "aws", "docker", "api", "rest", "agile"],
  "Frontend Developer": ["html", "css", "javascript", "typescript", "react", "angular", "vue", "tailwind", "git", "figma", "responsive", "ui", "ux"],
  "Backend Developer": ["node.js", "python", "java", "sql", "postgresql", "mongodb", "docker", "kubernetes", "aws", "api", "rest", "microservices"],
  "Data Scientist": ["python", "r", "sql", "machine learning", "pandas", "numpy", "tensorflow", "pytorch", "scikit-learn", "data visualization", "statistics"],
  "Full Stack Developer": ["javascript", "typescript", "react", "node.js", "express", "sql", "mongodb", "git", "aws", "docker", "api", "html", "css"],
};

export function analyzeResume(text: string, targetRole: string = "Software Engineer"): ATSResult {
  const normalizedText = text.toLowerCase();
  
  // ─── 1. Contact Information (10 Points) ───
  let contactScore = 0;
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
  const linkedinMatch = normalizedText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/);
  const githubMatch = normalizedText.match(/github\.com\/[a-zA-Z0-9_-]+/);
  
  // Crude name extraction: First couple of words, looking for a suitable name line
  const firstLines = text.split('\n').filter(l => l.trim().length > 0).slice(0, 5);
  let name = null;
  for (const line of firstLines) {
    const trimmedLine = line.trim();
    const wordCount = trimmedLine.split(/\s+/).length;
    // Names are usually 1-5 words, don't contain numbers, and aren't "Resume" or "CV"
    if (wordCount >= 1 && wordCount <= 5 && !/\d/.test(trimmedLine) && !/^(resume|cv|curriculum vitae)$/i.test(trimmedLine)) {
      name = trimmedLine;
      break;
    }
  }

  if (name) contactScore += 2;
  if (emailMatch) contactScore += 3;
  if (phoneMatch) contactScore += 2;
  if (linkedinMatch) contactScore += 2;
  if (githubMatch) contactScore += 1;

  // ─── 2. Resume Structure (15 Points) ───
  let structureScore = 0;
  let wordCount = text.split(/\s+/).length;
  
  // Good length (300-800 words)
  if (wordCount > 300 && wordCount < 800) structureScore += 5;
  else if (wordCount > 200 && wordCount < 1000) structureScore += 3;

  const hasEducationHeader = /\b(education|academic|qualifications)\b/i.test(normalizedText);
  const hasExperienceHeader = /\b(experience|employment|work history|internship)\b/i.test(normalizedText);
  const hasSkillsHeader = /\b(skills|technologies|expertise)\b/i.test(normalizedText);
  const hasProjectsHeader = /\b(projects|portfolio)\b/i.test(normalizedText);

  if (hasEducationHeader) structureScore += 2.5;
  if (hasExperienceHeader) structureScore += 2.5;
  if (hasSkillsHeader) structureScore += 2.5;
  if (hasProjectsHeader) structureScore += 2.5;

  // ─── 3. Education (10 Points) ───
  let educationScore = 0;
  const educationKeywords = ["b.s.", "b.tech", "bachelor", "master", "m.s.", "ph.d", "btech", "degree"];
  const gpaMatch = normalizedText.match(/\b(gpa|cgpa)[:\s]+([0-9]\.[0-9]{1,2}|[1-9][0-9]\.?\d*%?)\b/i);
  const gradYearMatch = normalizedText.match(/\b(201[0-9]|202[0-9])\b/);
  
  let extractedEdu = [];
  if (educationKeywords.some(kw => normalizedText.includes(kw))) {
    educationScore += 5;
    extractedEdu.push("Degree Found");
  }
  if (gpaMatch) {
    educationScore += 3;
    extractedEdu.push(`GPA: ${gpaMatch[2]}`);
  }
  if (gradYearMatch) {
    educationScore += 2;
    extractedEdu.push(`Grad Year: ${gradYearMatch[0]}`);
  }

  // ─── 4. Technical Skills (20 Points) ───
  let skillsScore = 0;
  const extractedSkills: string[] = [];
  
  const allTechKeys = [...techKeywords.languages, ...techKeywords.frameworks, ...techKeywords.databases, ...techKeywords.tools];
  allTechKeys.forEach(skill => {
    // Exact word match
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(normalizedText)) {
      extractedSkills.push(skill);
    }
  });

  const uniqueSkills = [...new Set(extractedSkills)];
  if (uniqueSkills.length >= 10) skillsScore = 20;
  else if (uniqueSkills.length >= 7) skillsScore = 15;
  else if (uniqueSkills.length >= 4) skillsScore = 10;
  else if (uniqueSkills.length >= 1) skillsScore = 5;

  // ─── 5. Projects (20 Points) ───
  let projectsScore = 0;
  const extractedProjects = [];
  // Approximate project counts by looking for action verbs often used in projects, or "Project" mentions
  const projectMentions = (normalizedText.match(/\bproject\b/gi) || []).length;
  
  if (hasProjectsHeader) {
    projectsScore += 10; // Base score for having the section
    if (projectMentions >= 3) {
      projectsScore += 10;
      extractedProjects.push("Multiple projects detected");
    } else if (projectMentions >= 1) {
      projectsScore += 5;
      extractedProjects.push("At least one project detected");
    }
  }

  // ─── 6. Experience/Internships (10 Points) ───
  let experienceScore = 0;
  if (hasExperienceHeader) {
    experienceScore += 5;
    const internMatch = normalizedText.match(/\bintern(ship)?\b/i);
    const dateRangeMatch = normalizedText.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4} - (present|\d{4})/i);
    
    if (internMatch) experienceScore += 2;
    if (dateRangeMatch) experienceScore += 3;
  }

  // ─── 7. Certifications (5 Points) ───
  let certificationsScore = 0;
  const extractedCerts = [];
  const certMatch = normalizedText.match(/\b(certified|certification|coursera|udemy|aws|azure)[\s\w]+\b/i);
  if (certMatch) {
    certificationsScore = 5;
    extractedCerts.push(certMatch[0].trim());
  }

  // ─── 8. Keyword Matching (10 Points) ───
  let keywordScore = 0;
  const requiredKeywords = jobRoles[targetRole as keyof typeof jobRoles] || jobRoles["Software Engineer"];
  let matchedKeywords = 0;
  
  const missingSkills: string[] = [];
  requiredKeywords.forEach(kw => {
    if (normalizedText.includes(kw.toLowerCase())) {
      matchedKeywords++;
    } else {
      missingSkills.push(kw);
    }
  });

  const matchPercentage = matchedKeywords / requiredKeywords.length;
  if (matchPercentage >= 0.8) keywordScore = 10;
  else if (matchPercentage >= 0.6) keywordScore = 8;
  else if (matchPercentage >= 0.4) keywordScore = 5;
  else if (matchPercentage >= 0.2) keywordScore = 2;

  // ─── Compile Results ───
  const overallScore = Math.round(
    contactScore + structureScore + educationScore + skillsScore + 
    projectsScore + experienceScore + certificationsScore + keywordScore
  );

  const weakSections = [];
  const strengths = [];
  const suggestions = [];

  if (contactScore < 10) {
    weakSections.push("Contact Information");
    if (!linkedinMatch) suggestions.push("Add your LinkedIn profile URL.");
    if (!githubMatch) suggestions.push("Add your GitHub profile URL to showcase your code.");
  } else {
    strengths.push("Complete Contact Information");
  }

  if (structureScore < 10) {
    weakSections.push("Resume Structure");
    if (wordCount < 200) suggestions.push("Add more detail. Your resume is quite short.");
    if (wordCount > 800) suggestions.push("Be concise. Your resume is too long and might be skipped by ATS.");
    if (!hasSkillsHeader || !hasExperienceHeader) suggestions.push("Ensure you use standard headers like 'Skills' and 'Experience'.");
  } else {
    strengths.push("Strong Resume Structure");
  }

  if (skillsScore < 15) {
    weakSections.push("Technical Skills");
    suggestions.push("List more specific technical skills (languages, frameworks, tools) clearly.");
  } else {
    strengths.push("Excellent Technical Skills Section");
  }

  if (keywordScore < 8) {
    weakSections.push(`Keyword Match for ${targetRole}`);
    suggestions.push(`Include more keywords related to ${targetRole} to improve ATS ranking.`);
  } else {
    strengths.push(`High Keyword Match for ${targetRole}`);
  }

  if (projectsScore < 10) {
    suggestions.push("Add a dedicated 'Projects' section with detailed descriptions of your technical work.");
  }

  return {
    overallScore,
    breakdown: {
      contact: { score: contactScore, max: 10 },
      structure: { score: structureScore, max: 15 },
      education: { score: educationScore, max: 10 },
      skills: { score: skillsScore, max: 20 },
      projects: { score: projectsScore, max: 20 },
      experience: { score: experienceScore, max: 10 },
      certifications: { score: certificationsScore, max: 5 },
      keywordMatch: { score: keywordScore, max: 10 },
    },
    extracted: {
      name: name || "Not Found",
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0] : null,
      skills: uniqueSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
      education: extractedEdu,
      projects: extractedProjects,
      certifications: extractedCerts,
    },
    feedback: {
      missingSkills,
      weakSections,
      strengths,
      suggestions,
    }
  };
}
