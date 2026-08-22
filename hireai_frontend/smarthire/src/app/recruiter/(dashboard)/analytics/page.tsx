"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, Target, Briefcase, Award, CheckCircle2, Video } from "lucide-react";
import { getUserSession } from "@/actions/authActions";
import { SessionPayload } from "@/lib/auth";

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';

export default function AnalyticsPage() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    aiScreened: 0,
    shortlisted: 0,
    interviews: 0,
    hired: 0,
  });
  const [pipeline, setPipeline] = useState({
    applied: 0,
    ai_screening: 0,
    shortlisted: 0,
    interview: 0,
    hired: 0,
    rejected: 0,
  });
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserSession().then(async (sess) => {
      setSession(sess);
      if (sess?.token) {
        try {
          const res = await fetch(`${DJANGO_API_URL}/recruiter/dashboard`, {
            headers: { 'Authorization': `Bearer ${sess.token}` },
            cache: 'no-store',
          });
          if (res.ok) {
            const data = await res.json();
            setStats({
              activeJobs: data.live_jobs_count || 0,
              totalApplications: data.total_applications_count || 0,
              aiScreened: data.ai_screened_count || 0,
              shortlisted: data.shortlisted_count || 0,
              interviews: data.interviews_count || 0,
              hired: data.hired_count || 0,
            });
            if (data.pipeline) {
              setPipeline(data.pipeline);
            }
            if (Array.isArray(data.active_jobs)) {
              setActiveJobs(data.active_jobs);
            }
          }
        } catch (e) {
          console.warn('[Analytics Page] fetch error:', e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
  }, []);

  const total = Math.max(stats.totalApplications, 1);
  const shortlistRate = stats.totalApplications > 0 ? Math.round((stats.shortlisted / total) * 100) : 0;
  const interviewRate = stats.totalApplications > 0 ? Math.round((stats.interviews / total) * 100) : 0;
  const hireRate = stats.totalApplications > 0 ? Math.round((stats.hired / total) * 100) : 0;

  const funnelStages = [
    { stage: "Applied", count: pipeline.applied, percentage: stats.totalApplications > 0 ? Math.round((pipeline.applied / total) * 100) : 0, color: "bg-blue-500" },
    { stage: "AI Screened", count: pipeline.ai_screening, percentage: stats.totalApplications > 0 ? Math.round((pipeline.ai_screening / total) * 100) : 0, color: "bg-purple-500" },
    { stage: "Shortlisted", count: pipeline.shortlisted, percentage: shortlistRate, color: "bg-amber-500" },
    { stage: "Interview", count: pipeline.interview, percentage: interviewRate, color: "bg-indigo-500" },
    { stage: "Hired / Offer", count: pipeline.hired, percentage: hireRate, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            Recruitment Analytics & Funnel
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real database metrics on your hiring funnel and candidate progression.</p>
        </div>
      </div>

      {/* Real Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.totalApplications}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Applications</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{shortlistRate}%</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Shortlist Rate</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{interviewRate}%</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Interview Conversion</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{hireRate}%</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Offer / Hire Rate</p>
          </div>
        </div>
      </div>

      {/* Main Real Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real Hiring Funnel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Hiring Funnel Conversion
          </h2>
          <div className="space-y-4">
            {funnelStages.map((step, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-slate-700">{step.stage}</span>
                  <span className="font-bold text-slate-500">{step.count} ({step.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${step.color}`} style={{ width: `${Math.min(step.percentage, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real Active Requisitions Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Active Positions & Demand
            </h2>
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <div key={job.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.company} • {job.location}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-200">
                      {job.applicants_count || 0} Applicants
                    </span>
                  </div>
                </div>
              ))}

              {activeJobs.length === 0 && !loading && (
                <div className="py-8 text-center text-slate-400">
                  <p className="text-xs">No active positions posted yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
