"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StatsCard from "@/components/StatsCard";
import DynamicGreeting from "@/components/DynamicGreeting";
import { ResumeMatchRadar, SkillAnalysisChart } from "@/components/charts/CandidateCharts";
import RecommendedJobs from "@/components/RecommendedJobs";
import ResumeStatusCard from "@/components/ResumeStatusCard";
import {
  FileText,
  Sparkles,
  Brain,
  Eye,
  Briefcase
} from "lucide-react";
import { getResume } from "@/actions/resumeActions";
import { getAppliedJobs, getRecommendedJobs } from "@/actions/jobActions";
import { calculateATSScore, calculateMatchScore, generateRadarData } from "@/utils/scoring";

export default function CandidateDashboard() {
  const [resume, setResume] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [recommendedCount, setRecommendedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchResume = () => {
    Promise.all([
      getResume(),
      getAppliedJobs(),
      getRecommendedJobs()
    ]).then(([res, apps, recommended]) => {
      setResume(res);
      setApplications(apps);
      setRecommendedCount(recommended.length);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchResume();
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
  const rawSkills = hasResume ? (typeof resume.skills === 'string' ? JSON.parse(resume.skills || "[]") : (resume.skills || [])) : [];

  
  // Example target role configuration for the Match Score
  const targetRoleSkills = ["React", "TypeScript", "Node.js", "Python"];
  const matchResult = calculateMatchScore(resume ? resume.skills : null, targetRoleSkills);

  // Calculate Profile Completion
  let profileCompletion = 20; // Base completion
  if (hasResume) {
    let fields = 0;
    const safeLength = (val: any) => {
      if (!val) return 0;
      if (typeof val === 'string') {
        try { return JSON.parse(val).length; } catch { return 0; }
      }
      return val.length || 0;
    };

    if (resume.extractedName) fields++;
    if (resume.extractedEmail) fields++;
    if (resume.extractedPhone) fields++;
    if (safeLength(resume.education) > 0) fields++;
    if (safeLength(resume.skills) > 0) fields++;
    if (safeLength(resume.projects) > 0) fields++;
    if (safeLength(resume.certifications) > 0) fields++;
    fields++; // Resume upload itself

    profileCompletion = Math.round((fields / 8) * 100);
  }

  // Calculate Application Stats
  const totalApps = hasResume ? applications.length : 0;
  const shortlistedApps = hasResume ? applications.filter(a => a.application.status === 'Shortlisted').length : 0;
  const interviewApps = hasResume ? applications.filter(a => a.application.status === 'Interview Scheduled').length : 0;
  const recCount = hasResume ? recommendedCount : 0;

  const dynamicStats = [
    { 
      id: 1, 
      label: 'Total Applications', 
      value: totalApps, 
      change: totalApps > 0 ? '+1' : '0%', 
      changeType: "positive" as const,
      color: '#3b82f6',
      gradient: 'bg-blue-50 text-blue-500', 
      icon: 'Send',
      index: 0
    },
    { 
      id: 2, 
      label: 'Shortlisted', 
      value: shortlistedApps, 
      change: shortlistedApps > 0 ? '+1' : '0%', 
      changeType: "positive" as const,
      color: '#f59e0b',
      gradient: 'bg-amber-50 text-amber-500', 
      icon: 'Star',
      index: 1
    },
    { 
      id: 3, 
      label: 'Interviews', 
      value: interviewApps, 
      change: interviewApps > 0 ? '+1' : '0%', 
      changeType: "positive" as const,
      color: '#8b5cf6',
      gradient: 'bg-purple-50 text-purple-500', 
      icon: 'Video',
      index: 2
    },
    { 
      id: 4, 
      label: 'Recommended Jobs', 
      value: recCount, 
      change: recCount > 0 ? '+5' : '0%', 
      changeType: "positive" as const,
      color: '#22c55e',
      gradient: 'bg-green-50 text-green-500', 
      icon: 'Sparkles',
      index: 3
    },
    { 
      id: 5, 
      label: 'Resume Score', 
      value: hasResume && atsScore !== null ? atsScore : '--', 
      suffix: hasResume && atsScore !== null ? '%' : '',
      change: hasResume && atsScore !== null ? '+12%' : 'Upload Resume to Generate Score', 
      changeType: (hasResume && atsScore !== null ? "positive" : "neutral") as any,
      color: '#0ea5e9',
      gradient: 'bg-sky-50 text-sky-500', 
      icon: 'FileText',
      index: 4
    },
    { 
      id: 6, 
      label: 'Profile Completion', 
      value: profileCompletion, 
      suffix: '%',
      change: hasResume ? '+80%' : '0%', 
      changeType: "positive" as const,
      color: '#ec4899',
      gradient: 'bg-pink-50 text-pink-500', 
      icon: 'User',
      index: 5
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <DynamicGreeting onUploadSuccess={fetchResume} />

      {/* Resume Status Card */}
      <ResumeStatusCard 
        hasResume={hasResume} 
        resume={resume} 
        onUploadSuccess={fetchResume} 
      />

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

      {/* Resume AI Feedback */}
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
            <h3 className="text-base font-semibold text-white">AI Resume Feedback</h3>
          </div>
          <p className="text-xs text-white/60">Powered by SmartHire AI</p>
        </div>
        <div className="p-5 space-y-4">
          {!hasResume ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">Upload your resume to generate AI analysis.</p>
            </div>
          ) : (
            <>
              {/* Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100/50 text-center">
                  <p className="text-2xl font-bold text-blue-600">{matchResult.percentage}%</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Match Score (Full Stack Dev)</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100/50 text-center">
                  <p className="text-2xl font-bold text-purple-600">{atsScore !== null ? atsScore : "--"}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">ATS Score</p>
                </div>
              </div>

              {/* AI Summary */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-100/30">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Your resume has a strong foundation with {rawSkills.length} extracted skills. 
                    {matchResult.missing.length > 0 && ` Consider adding these missing skills for your target role: ${matchResult.missing.join(", ")}.`}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Recommended Jobs */}
      {hasResume && <RecommendedJobs />}
    </div>
  );
}
