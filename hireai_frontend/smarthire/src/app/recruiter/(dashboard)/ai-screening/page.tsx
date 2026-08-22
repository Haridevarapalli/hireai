"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Brain, Award, Sparkles, CheckCircle2, ChevronRight, ArrowRight } from "lucide-react";
import { getUserSession } from "@/actions/authActions";
import { SessionPayload } from "@/lib/auth";

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';

interface RealApplicant {
  id: number;
  name: string;
  email: string;
  role: string;
  skills: string[];
  atsScore: number;
  matchScore: number;
  status: string;
  appliedDate: string;
}

export default function AIScreeningPage() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [applicants, setApplicants] = useState<RealApplicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserSession().then(async (sess) => {
      setSession(sess);
      if (sess?.token) {
        try {
          const res = await fetch(`${DJANGO_API_URL}/recruiter/ai-screening`, {
            headers: { 'Authorization': `Bearer ${sess.token}` },
            cache: 'no-store',
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              const mapped: RealApplicant[] = data.map((item: any) => ({
                id: item.id,
                name: item.candidate_name || item.candidate_email.split('@')[0],
                email: item.candidate_email,
                role: item.job_title || 'Software Developer',
                skills: Array.isArray(item.skills) && item.skills.length > 0 ? item.skills : ['Python', 'SQL'],
                atsScore: item.ats_score || item.match_score || 75,
                matchScore: item.match_score || 75,
                status: item.status || 'ai_screening',
                appliedDate: new Date(item.applied_at || Date.now()).toLocaleDateString("en-GB", {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }),
              }));
              // Rank by matchScore then atsScore
              mapped.sort((a, b) => b.matchScore - a.matchScore || b.atsScore - a.atsScore);
              setApplicants(mapped);
            }
          }
        } catch (e) {
          console.warn('[AI Screening] Fetch error:', e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
  }, []);

  // Compute live aggregated skill distribution from real applicants in AI Screening
  const skillCountMap: Record<string, number> = {};
  applicants.forEach(a => {
    a.skills.forEach(s => {
      skillCountMap[s] = (skillCountMap[s] || 0) + 1;
    });
  });
  const topApplicantSkills = Object.entries(skillCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const highMatchCount = applicants.filter(a => a.matchScore >= 70).length;
  const recommendedCount = applicants.filter(a => a.matchScore >= 70 && a.atsScore >= 60).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI Screening & Evaluation Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated semantic resume analysis, ATS compatibility scoring, and candidate skill matching for screened applicants.
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{applicants.length}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">In AI Screening</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{highMatchCount}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">High Match (≥70%)</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{recommendedCount}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recommended for Shortlist</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Real Top Ranked Candidates */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                AI-Evaluated Candidate Rankings
              </h2>
              <span className="text-xs text-slate-400">Ranked by Match Score & ATS Quality</span>
            </div>

            <div className="space-y-3">
              {applicants.map((candidate, i) => (
                <div
                  key={candidate.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 hover:bg-purple-50/40 rounded-2xl border border-slate-100 transition-colors gap-3 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                      #{i + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-sm group-hover:text-purple-600 transition-colors">
                          {candidate.name}
                        </p>
                        <span className="text-xs text-slate-400">({candidate.role})</span>
                      </div>
                      <p className="text-xs text-slate-500">{candidate.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {candidate.skills.slice(0, 4).map((s, sIdx) => (
                          <span key={sIdx} className="px-2 py-0.5 bg-white text-slate-600 rounded text-[10px] border border-slate-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">{candidate.matchScore}% Match</p>
                      <p className="text-[10px] text-slate-400">ATS: {candidate.atsScore}/100</p>
                    </div>
                    <Link
                      href={`/recruiter/applicants?selected=${candidate.id}`}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1"
                    >
                      Review <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}

              {applicants.length === 0 && !loading && (
                <div className="py-12 text-center text-slate-400">
                  <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">No candidates in AI Screening</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    To evaluate candidates in AI Screening, select &quot;Move to AI Screening&quot; on applied candidates in the Applications pipeline.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Real Applicant Skills & Screening Workflow */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Applicant Skill Distribution
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Real frequency of technical skills identified across candidate resumes.
            </p>

            <div className="space-y-3">
              {topApplicantSkills.map(([skill, count], i) => {
                const percent = Math.round((count / Math.max(applicants.length, 1)) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{skill}</span>
                      <span className="text-purple-600">{count} candidates ({percent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}

              {topApplicantSkills.length === 0 && !loading && (
                <p className="text-xs text-slate-400 py-4 text-center">No skill data available yet.</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 rounded-2xl p-6 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold">Intelligent ATS Screening</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              SmartHire AI extracts contact info, technical skill tags, education history, and experience from uploaded resumes. Candidates with skill match scores ≥ 70% are automatically recommended for shortlisting.
            </p>
            <Link
              href="/recruiter/applicants"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-purple-200 transition-colors"
            >
              Open Full Applications Pipeline <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
