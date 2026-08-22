"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatsCard from "@/components/StatsCard";
import DynamicGreeting from "@/components/DynamicGreeting";
import { ResumeMatchRadar, SkillAnalysisChart } from "@/components/charts/CandidateCharts";
import RecommendedJobs from "@/components/RecommendedJobs";
import {
  FileText,
  Sparkles,
  Brain,
  Eye,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Target,
  Zap,
} from "lucide-react";
import { getResume } from "@/actions/resumeActions";
import { getAppliedJobs, getRecommendedJobs, seedJobs } from "@/actions/jobActions";
import { calculateMatchScore, generateRadarData, parseArray, normalizeCandidateSkills, isRequirementMatched } from "@/utils/scoring";

export default function CandidateDashboard() {
  const [resume, setResume] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [recommendedCount, setRecommendedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    // Seed jobs on first visit
    await seedJobs();

    const [res, apps, recommended] = await Promise.all([
      getResume(),
      getAppliedJobs(),
      getRecommendedJobs()
    ]);
    setResume(res);
    setApplications(apps);

    const rawCandidateSkills = res ? parseArray(res.skills) : [];
    const normalizedSkills = normalizeCandidateSkills(rawCandidateSkills);
    let matchCount = 0;
    if (rawCandidateSkills.length > 0 && Array.isArray(recommended)) {
      matchCount = recommended.filter((job: any) => {
        if (Array.isArray(job.matchedSkills) && job.matchedSkills.length > 0) {
          return true;
        }
        const jobReqs = parseArray(job.requirements);
        if (jobReqs.length > 0) {
          return jobReqs.some((req: string) => isRequirementMatched(normalizedSkills, req));
        }
        return false;
      }).length;
    }
    setRecommendedCount(matchCount);
    setLoading(false);
  };

  const fetchResume = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="animate-pulse font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  const hasResume = !!resume;
  
  const atsScore = hasResume && resume.overallScore != null ? resume.overallScore : null;
  const radarData = generateRadarData(resume);
  const rawSkills = hasResume ? parseArray(resume.skills) : [];

  
  // Target role skills based on top in-demand skills for freshers
  const targetRoleSkills = ["React", "TypeScript", "Node.js", "Python", "SQL", "Docker"];
  const matchResult = calculateMatchScore(resume ? resume.skills : null, targetRoleSkills);

  // Calculate Profile Completion from the 8 profile sections (12.5% each)
  const safeLength = (val: any) => {
    if (!val) return 0;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed.length : (parsed ? 1 : 0);
      } catch {
        return val.trim().length > 0 ? 1 : 0;
      }
    }
    return Array.isArray(val) ? val.length : (val ? 1 : 0);
  };

  let completedSections = 0;

  // 1. Full Name
  const fullName = resume?.extractedName;
  if (fullName && fullName !== 'Not Found' && fullName.trim() !== '') {
    completedSections++;
  }

  // 2. Email
  const email = resume?.extractedEmail;
  if (email && email.trim() !== '' && email.includes('@')) {
    completedSections++;
  }

  // 3. Phone Number
  const phone = resume?.extractedPhone;
  if (phone && phone !== 'Not Found' && phone.trim() !== '') {
    completedSections++;
  }

  // 4. Location
  const location = resume?.location || resume?.extractedLocation;
  if (location && location !== 'Not Found' && location.trim() !== '') {
    completedSections++;
  }

  // 5. Education
  if (safeLength(resume?.education) > 0) {
    completedSections++;
  }

  // 6. Technical Skills
  if (safeLength(resume?.skills) > 0) {
    completedSections++;
  }

  // 7. Projects / Work Experience
  if (safeLength(resume?.projects) > 0 || safeLength(resume?.experience) > 0) {
    completedSections++;
  }

  // 8. Active Resume
  if (hasResume) {
    completedSections++;
  }

  const profileCompletion = Math.min(100, Math.round((completedSections / 8) * 100));

  // Calculate Application Stats
  const totalApps = applications.length;
  const shortlistedApps = applications.filter(a => (a.application?.status || '').toLowerCase() === 'shortlisted').length;
  const interviewApps = applications.filter(a => {
    const s = (a.application?.status || '').toLowerCase();
    return s === 'interview scheduled' || s === 'interview' || s.includes('interview');
  }).length;
  const hiredApps = applications.filter(a => {
    const s = (a.application?.status || '').toLowerCase();
    return s === 'hired' || s === 'selected' || s.includes('offer');
  }).length;
  const recCount = recommendedCount;

  const dynamicStats = [
    { 
      id: 1, 
      label: 'Applied', 
      value: totalApps, 
      change: totalApps > 0 ? `${totalApps} active` : 'Apply to jobs', 
      changeType: (totalApps > 0 ? "positive" : "neutral") as "positive" | "negative" | "neutral",
      color: '#3b82f6',
      gradient: 'bg-blue-50 text-blue-500', 
      icon: 'Send',
      index: 0
    },
    { 
      id: 2, 
      label: 'Shortlisted', 
      value: shortlistedApps, 
      change: shortlistedApps > 0 ? `${Math.round(shortlistedApps / Math.max(totalApps, 1) * 100)}% rate` : 'Pending', 
      changeType: (shortlistedApps > 0 ? "positive" : "neutral") as "positive" | "negative" | "neutral",
      color: '#f59e0b',
      gradient: 'bg-amber-50 text-amber-500', 
      icon: 'Star',
      index: 1
    },
    { 
      id: 3, 
      label: 'Interviews', 
      value: interviewApps, 
      change: interviewApps > 0 ? (interviewApps === 1 ? '1 Scheduled' : `${interviewApps} Scheduled`) : 'None scheduled', 
      changeType: (interviewApps > 0 ? "positive" : "neutral") as "positive" | "negative" | "neutral",
      color: '#8b5cf6',
      gradient: 'bg-purple-50 text-purple-500', 
      icon: 'Video',
      index: 2
    },
    { 
      id: 4, 
      label: 'Hired', 
      value: hiredApps, 
      change: hiredApps > 0 ? (hiredApps === 1 ? '1 Job Offer' : `${hiredApps} Job Offers`) : '0 offers', 
      changeType: (hiredApps > 0 ? "positive" : "neutral") as "positive" | "negative" | "neutral",
      color: '#10b981',
      gradient: 'bg-emerald-50 text-emerald-500', 
      icon: 'Award',
      index: 3
    },
    { 
      id: 5, 
      label: 'ATS Score', 
      value: hasResume && atsScore !== null ? atsScore : '--', 
      suffix: hasResume && atsScore !== null ? '/100' : '',
      change: hasResume && atsScore !== null 
        ? (atsScore >= 75 ? 'Excellent' : atsScore >= 50 ? 'Good — Improve it' : 'Needs work') 
        : 'Upload resume', 
      changeType: (hasResume && atsScore !== null 
        ? (atsScore >= 50 ? "positive" : "negative") 
        : "neutral") as "positive" | "negative" | "neutral",
      color: '#0ea5e9',
      gradient: 'bg-sky-50 text-sky-500', 
      icon: 'FileText',
      index: 4
    },
    { 
      id: 6, 
      label: 'Job Matches', 
      value: recCount, 
      change: recCount > 0 ? `${recCount} found` : 'Upload resume', 
      changeType: (recCount > 0 ? "positive" : "neutral") as "positive" | "negative" | "neutral",
      color: '#ec4899',
      gradient: 'bg-pink-50 text-pink-500', 
      icon: 'Sparkles',
      index: 5
    },
  ];

  // Get resume feedback data
  const feedback = hasResume && resume.feedback 
    ? (typeof resume.feedback === 'string' ? JSON.parse(resume.feedback) : resume.feedback) 
    : null;
  const scoreBreakdown = hasResume && resume.scoreBreakdown
    ? (typeof resume.scoreBreakdown === 'string' ? JSON.parse(resume.scoreBreakdown) : resume.scoreBreakdown)
    : null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <DynamicGreeting onUploadSuccess={fetchResume} profileCompletion={profileCompletion} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {dynamicStats.map((stat) => (
          <StatsCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResumeMatchRadar data={radarData} overallScore={matchResult.percentage} />
        <SkillAnalysisChart data={radarData} hasResume={hasResume} />
      </div>

      {/* AI Resume Insights — Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
        style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
      >
        <div className="px-6 pt-5 pb-4 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-white/80" />
            <h3 className="text-base font-semibold text-white">AI Resume Insights</h3>
          </div>
          <p className="text-xs text-white/60">Powered by SmartHire AI • Personalized analysis</p>
        </div>
        <div className="p-5 space-y-4">
          {!hasResume ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">Upload your resume to generate AI analysis.</p>
              <p className="text-xs text-slate-400 mt-1">Get ATS scoring, skill gap analysis, and actionable improvement tips.</p>
            </div>
          ) : (
            <>
              {/* Score Cards Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100/50 text-center">
                  <p className="text-2xl font-bold text-blue-600">{matchResult.percentage}%</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Role Match</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100/50 text-center">
                  <p className="text-2xl font-bold text-purple-600">{atsScore !== null ? atsScore : "--"}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">ATS Score</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{rawSkills.length}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Skills Found</p>
                </div>
              </div>

              {/* Strengths */}
              {feedback?.strengths && feedback.strengths.length > 0 && (
                <div className="p-3 rounded-xl bg-green-50/40 border border-green-100/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-xs font-semibold text-green-700">Strengths</span>
                  </div>
                  <div className="space-y-1.5">
                    {feedback.strengths.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-green-400 text-xs mt-0.5">✓</span>
                        <p className="text-xs text-slate-600 leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Suggestions */}
              {feedback?.suggestions && feedback.suggestions.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-100/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-700">Improvement Tips</span>
                  </div>
                  <div className="space-y-1.5">
                    {feedback.suggestions.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <ArrowUpRight className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-600 leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {matchResult.missing.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50/40 border border-red-100/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs font-semibold text-red-600">Missing In-Demand Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.missing.map((skill: string, i: number) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-red-100/60 text-red-600 font-medium border border-red-200/50">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Based on top job requirements from Amazon, Google, Microsoft, etc.</p>
                </div>
              )}

              {/* Score Breakdown */}
              {scoreBreakdown && (
                <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Target className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-600">ATS Score Breakdown</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(scoreBreakdown).map(([key, val]: [string, any]) => (
                      <div key={key} className="text-center">
                        <div className="w-full bg-slate-200/60 rounded-full h-1.5 mb-1.5">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" 
                            style={{ width: `${Math.round((val.score / val.max) * 100)}%` }} 
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium capitalize">{key}</p>
                        <p className="text-[10px] text-slate-400">{val.score}/{val.max}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summary */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-100/30">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Your resume shows <strong>{rawSkills.length} technical skills</strong> across {radarData.filter(d => d.score > 0).length} categories.
                    {matchResult.percentage >= 75 
                      ? " You're a strong match for full-stack roles at top tech companies!"
                      : matchResult.percentage >= 50 
                        ? " You have a solid foundation — focus on the missing skills above to boost your match score."
                        : " Consider upskilling in the highlighted areas to improve your competitiveness."}
                    {" "}{totalApps > 0 && `You've applied to ${totalApps} job${totalApps > 1 ? 's' : ''} so far.`}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Recent Application Activity */}
      {totalApps > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
          style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <div>
                <h3 className="text-base font-semibold text-slate-800">Recent Activity</h3>
                <p className="text-xs text-slate-400 mt-0.5">Your latest job application updates</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {applications.slice(0, 5).map((app, i) => {
              const statusColors: Record<string, string> = {
                'Applied': 'bg-blue-50 text-blue-600 border-blue-100',
                'Under Review': 'bg-amber-50 text-amber-600 border-amber-100',
                'AI Screened': 'bg-purple-50 text-purple-600 border-purple-100',
                'Shortlisted': 'bg-green-50 text-green-600 border-green-100',
                'Interview Scheduled': 'bg-indigo-50 text-indigo-600 border-indigo-100',
                'Selected': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                'Rejected': 'bg-red-50 text-red-500 border-red-100',
              };
              return (
                <motion.div
                  key={app.application.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                      {app.job?.companyName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{app.job?.title || 'Unknown Job'}</p>
                      <p className="text-xs text-slate-400">{app.job?.companyName} • {app.job?.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {app.application.matchScore != null && (
                      <span className="text-xs font-medium text-slate-400">{app.application.matchScore}% match</span>
                    )}
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[app.application.status] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                      {app.application.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recommended Jobs */}
      <RecommendedJobs />
    </div>
  );
}
