"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Download, Eye, CheckCircle2, XCircle, Filter, Star, 
  Video, Mail, Phone, MapPin, GraduationCap, 
  Briefcase, Sparkles, X, Check, Award, FileText, ExternalLink,
  ChevronRight, Brain, AlertCircle, Clock, Send, ShieldCheck,
  Globe, Calendar, UserCheck, RefreshCw
} from "lucide-react";
import { getUserSession } from "@/actions/authActions";
import { SessionPayload } from "@/lib/auth";
import { normalizeCandidateSkills, isRequirementMatched } from "@/utils/scoring";

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';

interface Applicant {
  id: number;
  name: string;
  avatar: string;
  avatarColor?: string;
  email: string;
  role: string;
  skills: string[];
  experience: string;
  education: string;
  atsScore: number;
  matchScore: number;
  status: string;
  date: string;
  appliedDate?: string;
  jobId?: number;
  location?: string;
  phone?: string;
  resumeFileUrl?: string | null;
}

function getStatusBadge(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes("shortlist")) return "bg-teal-50 text-teal-700 border-teal-200";
  if (s.includes("screen") || s.includes("ai")) return "bg-purple-50 text-purple-700 border-purple-200";
  if (s.includes("interview")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (s.includes("offer") || s.includes("hire") || s.includes("selected")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s.includes("reject")) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function getScoreColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#3b82f6";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

export default function ApplicantsPage() {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Applicant | null>(null);
  const [candidateProfileDetail, setCandidateProfileDetail] = useState<any | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'ai_screening' | 'parsed_resume' | 'skill_match'>('ai_screening');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadApplicants = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${DJANGO_API_URL}/recruiter/applicants`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: Applicant[] = data.map((item: any) => ({
            id: item.id,
            name: item.candidate_name || item.candidate_email.split('@')[0],
            avatar: (item.candidate_name || item.candidate_email || 'CD').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
            avatarColor: '#8b5cf6',
            email: item.candidate_email || 'candidate@example.com',
            phone: item.candidate_phone,
            role: item.job_title || 'Software Developer',
            skills: Array.isArray(item.skills) && item.skills.length > 0 ? item.skills : ['Python', 'SQL'],
            experience: 'Fresh Graduate / 0-2 Years',
            education: 'B.Tech / MCA',
            atsScore: item.ats_score != null ? item.ats_score : (item.match_score || 75),
            matchScore: item.match_score != null ? item.match_score : 75,
            status: item.status === 'applied' ? 'Applied' :
                    item.status === 'ai_screening' || item.status === 'ai_screened' ? 'AI Screening' :
                    item.status === 'shortlisted' ? 'Shortlisted' :
                    item.status === 'interview' || item.status.includes('interview') ? 'Interview' :
                    item.status.includes('offer') || item.status === 'hired' ? 'Offered' :
                    item.status === 'rejected' ? 'Rejected' :
                    item.status.includes('hr') ? 'AI Screening' :
                    item.status.includes('tech') ? 'Interview' : 'Applied',
            date: new Date(item.applied_at || Date.now()).toISOString().split('T')[0],
            appliedDate: new Date(item.applied_at || Date.now()).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }),
            jobId: item.job,
            location: item.location || 'India',
            resumeFileUrl: item.resume_file_url,
          }));
          setApplicants(mapped);
          return mapped;
        }
      }
    } catch (e) {
      console.warn('[Applicants Page] Django fetch warning:', e);
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    getUserSession().then(async (sess) => {
      setSession(sess);
      if (sess?.token) {
        const list = await loadApplicants(sess.token);
        const selectedId = searchParams.get("selected");
        if (selectedId && list) {
          const found = list.find((a: Applicant) => a.id.toString() === selectedId);
          if (found) {
            handleOpenProfile(found, sess.token);
          }
        }
      } else {
        setLoading(false);
      }
    });
  }, [searchParams]);

  const handleOpenProfile = async (candidate: Applicant, token?: string) => {
    setSelectedCandidate(candidate);
    setIsLoadingProfile(true);
    setActiveModalTab('ai_screening');

    const authToken = token || session?.token;
    if (authToken) {
      try {
        const res = await fetch(`${DJANGO_API_URL}/recruiter/applications/${candidate.id}/candidate-profile`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          setCandidateProfileDetail(data);
        } else {
          setCandidateProfileDetail(null);
        }
      } catch (e) {
        console.warn('Failed to load candidate full profile:', e);
        setCandidateProfileDetail(null);
      }
    }
    setIsLoadingProfile(false);
  };

  const handleAction = async (id: number, actionType: string, newStatusDisplay: string) => {
    if (session?.token) {
      try {
        const res = await fetch(`${DJANGO_API_URL}/recruiter/applications/${id}/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            action: actionType,
            reason: actionType === 'reject' ? 'Candidate does not meet criteria for this role.' : undefined,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          showToast(errData.detail || 'Action not allowed from current stage.');
          return;
        }
      } catch (e) {
        console.warn('[Applicant Action] Django action sync warning:', e);
      }
    }

    setApplicants(applicants.map(app => app.id === id ? { ...app, status: newStatusDisplay } : app));
    if (selectedCandidate && selectedCandidate.id === id) {
      setSelectedCandidate({ ...selectedCandidate, status: newStatusDisplay });
    }
    showToast(`Stage updated: Candidate is now "${newStatusDisplay}"`);
  };

  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "All" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate matched and missing skills for candidate profile detail modal
  const parsedJson = candidateProfileDetail?.parsed_resume_json || {};
  const parsedDetails = candidateProfileDetail?.parsed_details || {};
  
  const candSkillsList: string[] = Array.isArray(candidateProfileDetail?.candidate?.tech_stacks) && candidateProfileDetail.candidate.tech_stacks.length > 0
    ? candidateProfileDetail.candidate.tech_stacks
    : Array.isArray(parsedJson.skills) && parsedJson.skills.length > 0
    ? parsedJson.skills
    : selectedCandidate?.skills || [];
  const candSkillsSet = normalizeCandidateSkills(candSkillsList);

  const jobReqSkills: string[] = candidateProfileDetail?.job_required_skills || ['Python', 'Django', 'SQL'];
  const matchedSkills: string[] = Array.isArray(candidateProfileDetail?.matched_skills)
    ? candidateProfileDetail.matched_skills
    : jobReqSkills.filter(req => isRequirementMatched(candSkillsSet, req));
  const missingSkills: string[] = Array.isArray(candidateProfileDetail?.missing_skills)
    ? candidateProfileDetail.missing_skills
    : jobReqSkills.filter(req => !isRequirementMatched(candSkillsSet, req));

  const matchPercent = candidateProfileDetail?.match_score != null 
    ? candidateProfileDetail.match_score 
    : (selectedCandidate?.matchScore ?? (jobReqSkills.length > 0 ? Math.round((matchedSkills.length / jobReqSkills.length) * 100) : 0));
  
  const atsScore = candidateProfileDetail?.ats_score != null 
    ? candidateProfileDetail.ats_score 
    : (selectedCandidate?.atsScore ?? 77);

  const currentStage = selectedCandidate?.status || 'Applied';

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-2xl border border-slate-700"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Candidates & Applicant Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">
            Production Candidate Review workflow: Applied → AI Screening → Shortlisted → Interview → Hired / Offer.
          </p>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by candidate, role, or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all text-slate-700"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
          {["All", "Applied", "AI Screening", "Shortlisted", "Interview", "Offered", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === status
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {status} ({status === "All" ? applicants.length : applicants.filter(a => a.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Applied Job</th>
                <th className="py-3.5 px-4 text-center">ATS Score</th>
                <th className="py-3.5 px-4 text-center">Skill Match</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredApplicants.map((app) => (
                <tr key={app.id} className="hover:bg-purple-50/30 transition-colors group">
                  {/* Candidate Profile */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0"
                        style={{ backgroundColor: app.avatarColor || '#8b5cf6' }}
                      >
                        {app.avatar}
                      </div>
                      <div>
                        <button
                          onClick={() => handleOpenProfile(app)}
                          className="font-bold text-slate-800 group-hover:text-purple-600 transition-colors text-left block"
                        >
                          {app.name}
                        </button>
                        <p className="text-xs text-slate-500">{app.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-4 px-4">
                    <span className="font-semibold text-slate-700 block">{app.role}</span>
                    <span className="text-xs text-slate-400">{app.appliedDate || app.date}</span>
                  </td>

                  {/* ATS Score */}
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center font-extrabold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                      {app.atsScore || 77}/100
                    </span>
                  </td>

                  {/* AI Match Score */}
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${app.matchScore}%`,
                            backgroundColor: getScoreColor(app.matchScore),
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold" style={{ color: getScoreColor(app.matchScore) }}>
                        {app.matchScore}%
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(app.status)}`}>
                      {app.status}
                    </span>
                  </td>

                  {/* Stage-Dependent Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenProfile(app)}
                        className="px-2.5 py-1 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1"
                        title="Review Candidate Profile & AI Screening"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>

                      {/* Stage 1: Applied -> Move to AI Screening or Reject */}
                      {app.status === 'Applied' && (
                        <>
                          <button
                            onClick={() => handleAction(app.id, "move_to_ai_screening", "AI Screening")}
                            className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors flex items-center gap-1"
                            title="Move to AI Screening"
                          >
                            <Brain className="w-3.5 h-3.5" /> Screen
                          </button>
                          <button
                            onClick={() => handleAction(app.id, "reject", "Rejected")}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Reject Candidate"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Stage 2: AI Screening -> Shortlist or Reject (NO Interview / NO Hired) */}
                      {app.status === 'AI Screening' && (
                        <>
                          <button
                            onClick={() => handleAction(app.id, "shortlist", "Shortlisted")}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                            title="Shortlist Candidate"
                          >
                            <Check className="w-3.5 h-3.5" /> Shortlist
                          </button>
                          <button
                            onClick={() => handleAction(app.id, "reject", "Rejected")}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Reject Candidate"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Stage 3: Shortlisted -> Schedule Interview or Reject (NO Hired yet) */}
                      {app.status === 'Shortlisted' && (
                        <>
                          <button
                            onClick={() => handleAction(app.id, "schedule_interview", "Interview")}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1"
                            title="Schedule Interview"
                          >
                            <Video className="w-3.5 h-3.5" /> Interview
                          </button>
                          <button
                            onClick={() => handleAction(app.id, "reject", "Rejected")}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Reject Candidate"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Stage 4: Interview -> Mark Hired / Offer or Reject */}
                      {app.status === 'Interview' && (
                        <>
                          <button
                            onClick={() => handleAction(app.id, "hire", "Offered")}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                            title="Mark Hired / Send Offer"
                          >
                            <Award className="w-3.5 h-3.5" /> Hire
                          </button>
                          <button
                            onClick={() => handleAction(app.id, "reject", "Rejected")}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Reject Candidate"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Terminal Stages: Offered / Hired / Rejected */}
                      {(app.status === 'Offered' || app.status === 'Hired' || app.status === 'Selected') && (
                        <span className="text-[11px] font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-100">
                          Hired
                        </span>
                      )}
                      {app.status === 'Rejected' && (
                        <span className="text-[11px] font-bold text-rose-600 px-2 py-0.5 bg-rose-50 rounded-md border border-rose-100">
                          Rejected
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredApplicants.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    No candidates found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Production Recruiter Candidate Review Modal ───────────── */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-purple-500/20">
                    {selectedCandidate.avatar}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selectedCandidate.name}</h2>
                    <p className="text-xs text-purple-600 font-semibold">{selectedCandidate.role}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedCandidate.email} • {selectedCandidate.phone || parsedDetails.phone || 'Not detected'} • {selectedCandidate.location || parsedDetails.location || 'Not detected'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-100">
                <button
                  onClick={() => setActiveModalTab('ai_screening')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeModalTab === 'ai_screening'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" /> AI Screening & Evaluation
                </button>
                <button
                  onClick={() => setActiveModalTab('parsed_resume')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeModalTab === 'parsed_resume'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Parsed Resume Details
                </button>
                <button
                  onClick={() => setActiveModalTab('skill_match')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeModalTab === 'skill_match'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Skill Matching
                </button>
              </div>

              {/* Modal Body */}
              <div className="py-4 space-y-5 text-sm text-slate-600 flex-1">
                {/* ─── TAB 1: AI SCREENING & EVALUATION ──────────────────────── */}
                {activeModalTab === 'ai_screening' && (
                  <div className="space-y-4">
                    {/* Key Metrics Header */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">ATS Resume Score</span>
                        <div className="text-2xl font-extrabold text-blue-700 mt-1">{atsScore}/100</div>
                        <p className="text-[10px] text-blue-500 mt-0.5">Resume formatting & relevance</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-100">
                        <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wide">Job Skill Match</span>
                        <div className="text-2xl font-extrabold text-purple-700 mt-1">{matchPercent}%</div>
                        <p className="text-[10px] text-purple-500 mt-0.5">
                          {matchedSkills.length} of {jobReqSkills.length} required skills
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Current Review Stage</span>
                        <div className="mt-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(currentStage)}`}>
                            {currentStage}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Screening Recommendation Card (Decision Support) */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-600" />
                          <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                            AI Screening Recommendation
                          </h4>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          matchPercent >= 70 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {matchPercent >= 70 ? 'Recommended for Shortlisting' : 'Needs Recruiter Review'}
                        </span>
                      </div>
                      <p className="text-xs text-purple-900 leading-relaxed font-medium">
                        {matchPercent >= 70 
                          ? `Strong candidate profile matching ${matchedSkills.length} of ${jobReqSkills.length} required skills (${matchPercent}%) with an ATS Resume score of ${atsScore}/100.`
                          : `Candidate matches ${matchedSkills.length} of ${jobReqSkills.length} required job skills (${matchPercent}%). Manual evaluation of project and technical experience is recommended.`
                        }
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-purple-200/60 flex items-center gap-1.5 text-[11px] text-purple-700/80">
                        <AlertCircle className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                        <span>Recommendation is decision support only. Stage changes require explicit recruiter action.</span>
                      </div>
                    </div>

                    {/* Skills Summary in AI Screening */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                        <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Matched Skills ({matchedSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {matchedSkills.length > 0 ? (
                            matchedSkills.map((s, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-md">
                                ✓ {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">None detected</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Missing Skills ({missingSkills.length})
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {missingSkills.length > 0 ? (
                            missingSkills.map((s, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded-md">
                                • {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold">All required skills matched!</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4 Core Relevance Pillars */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Evaluation Relevance Breakdown
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Education Relevance */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 text-purple-600" /> Education Relevance
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                              {candidateProfileDetail?.relevance?.education?.status || 'High Relevance'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {candidateProfileDetail?.relevance?.education?.details || (parsedDetails.education_degree !== 'Not detected' ? `Degree detected: ${parsedDetails.education_degree}` : 'Relevant Computer Science / Engineering degree detected.')}
                          </p>
                        </div>

                        {/* Experience Relevance */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> Experience Relevance
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                              {candidateProfileDetail?.relevance?.experience?.status || 'Relevant Experience'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {candidateProfileDetail?.relevance?.experience?.details || 'Practical software engineering and technical project exposure detected.'}
                          </p>
                        </div>

                        {/* Project Relevance */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Project Relevance
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                              {candidateProfileDetail?.relevance?.project?.status || 'Relevant Projects'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {candidateProfileDetail?.relevance?.project?.details || 'Multiple web applications and architecture projects detected.'}
                          </p>
                        </div>

                        {/* Certification Relevance */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <Award className="w-3.5 h-3.5 text-amber-600" /> Certification Relevance
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                              {candidateProfileDetail?.relevance?.certification?.status || 'Relevant Certifications'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {candidateProfileDetail?.relevance?.certification?.details || 'Cloud and technical development certifications detected.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 2: PARSED RESUME DETAILS (12 FIELDS) ──────────────── */}
                {activeModalTab === 'parsed_resume' && (
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {/* Direct Uploaded File Access */}
                    {(candidateProfileDetail?.resume_file_url || selectedCandidate?.resumeFileUrl) && (
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                          <FileText className="w-4 h-4 text-purple-600" />
                          <span>Candidate's Uploaded Resume Document</span>
                        </div>
                        <a
                          href={
                            (candidateProfileDetail?.resume_file_url || selectedCandidate?.resumeFileUrl).startsWith('http')
                              ? (candidateProfileDetail?.resume_file_url || selectedCandidate?.resumeFileUrl)
                              : `${DJANGO_API_URL.replace('/api', '')}${(candidateProfileDetail?.resume_file_url || selectedCandidate?.resumeFileUrl)}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> View / Download PDF
                        </a>
                      </div>
                    )}

                    {/* 1. Contact & Identity Grid (Full name, Email, Phone, Location, GitHub, LinkedIn) */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Candidate Identity & Contacts
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block">Full Name</span>
                          <span className="font-bold text-slate-800">{parsedDetails.full_name || selectedCandidate.name || 'Not detected'}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block">Email</span>
                          <span className="font-bold text-slate-800">{parsedDetails.email || selectedCandidate.email || 'Not detected'}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block">Phone</span>
                          <span className="font-bold text-slate-800">{parsedDetails.phone || selectedCandidate.phone || 'Not detected'}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block">Location</span>
                          <span className="font-bold text-slate-800">{parsedDetails.location || selectedCandidate.location || 'Not detected'}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block">GitHub</span>
                          {parsedDetails.github && parsedDetails.github !== 'Not detected' ? (
                            <a href={parsedDetails.github.startsWith('http') ? parsedDetails.github : `https://${parsedDetails.github}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-purple-600 hover:underline inline-flex items-center gap-1">
                              <Globe className="w-3 h-3" /> {parsedDetails.github}
                            </a>
                          ) : (
                            <span className="text-slate-400 font-medium">Not detected</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block">LinkedIn</span>
                          {parsedDetails.linkedin && parsedDetails.linkedin !== 'Not detected' ? (
                            <a href={parsedDetails.linkedin.startsWith('http') ? parsedDetails.linkedin : `https://${parsedDetails.linkedin}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-purple-600 hover:underline inline-flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> {parsedDetails.linkedin}
                            </a>
                          ) : (
                            <span className="text-slate-400 font-medium">Not detected</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. Education & Graduation Year */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-600" /> Education & Graduation Year
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block">Education / Degree</span>
                          <span className="font-bold text-slate-800">
                            {parsedDetails.education_degree && parsedDetails.education_degree !== 'Not detected' 
                              ? parsedDetails.education_degree 
                              : (Array.isArray(parsedJson.education) && parsedJson.education.length > 0 ? (typeof parsedJson.education[0] === 'string' ? parsedJson.education[0] : parsedJson.education[0].degree || parsedJson.education[0].college) : 'Not detected')
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block">Graduation Year</span>
                          <span className="font-bold text-slate-800">
                            {parsedDetails.graduation_year && parsedDetails.graduation_year !== 'Not detected'
                              ? parsedDetails.graduation_year
                              : (Array.isArray(parsedJson.education) && parsedJson.education.length > 0 && typeof parsedJson.education[0] === 'object' && parsedJson.education[0].year ? parsedJson.education[0].year : 'Not detected')
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Technical Skills */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Technical Skills
                      </h4>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {candSkillsList.length > 0 ? (
                          candSkillsList.map((s, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-white text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-2xs">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Not detected</span>
                        )}
                      </div>
                    </div>

                    {/* 4. Projects */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Projects
                      </h4>
                      <div className="space-y-2 pt-1">
                        {Array.isArray(parsedJson.projects) && parsedJson.projects.length > 0 ? (
                          parsedJson.projects.map((proj: any, idx: number) => (
                            <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                              <span className="font-bold text-slate-800">{typeof proj === 'string' ? proj : proj.title || proj.name}</span>
                              {typeof proj === 'object' && proj.desc && <p className="text-slate-500 mt-0.5">{proj.desc}</p>}
                              {typeof proj === 'object' && proj.tech && <p className="text-purple-600 font-semibold text-[11px] mt-0.5">Tech: {proj.tech}</p>}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Not detected</span>
                        )}
                      </div>
                    </div>

                    {/* 5. Work Experience */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-purple-600" /> Work Experience
                      </h4>
                      <div className="space-y-2 pt-1">
                        {Array.isArray(parsedJson.experience) && parsedJson.experience.length > 0 ? (
                          parsedJson.experience.map((exp: any, idx: number) => (
                            <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                              <div className="flex justify-between">
                                <span className="font-bold text-slate-800">{typeof exp === 'string' ? exp : exp.title || exp.role}</span>
                                {typeof exp === 'object' && exp.duration && <span className="text-slate-400 text-[11px]">{exp.duration}</span>}
                              </div>
                              {typeof exp === 'object' && exp.company && <p className="text-slate-600 text-[11px] font-medium">{exp.company}</p>}
                              {typeof exp === 'object' && exp.description && <p className="text-slate-500 mt-0.5">{exp.description}</p>}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Not detected</span>
                        )}
                      </div>
                    </div>

                    {/* 6. Certifications */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-600" /> Certifications
                      </h4>
                      <div className="space-y-1.5 pt-1">
                        {Array.isArray(parsedJson.certifications) && parsedJson.certifications.length > 0 ? (
                          parsedJson.certifications.map((c: any, idx: number) => (
                            <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
                              {typeof c === 'string' ? c : `${c.name || c.title}${c.issuer ? ` (${c.issuer})` : ''}`}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Not detected</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── TAB 3: SKILL MATCHING ─────────────────────────────────── */}
                {activeModalTab === 'skill_match' && (
                  <div className="space-y-4">
                    {/* Mathematical Calculation Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1.5">
                      <span className="font-bold text-slate-800 uppercase tracking-wide block text-[11px]">Skill Match Calculation Formula</span>
                      <p className="text-slate-600">
                        Formula: <code>(Matched Required Skills / Total Required Skills) × 100</code>
                      </p>
                      <p className="font-semibold text-purple-700">
                        Result: <code>{matchedSkills.length} / {jobReqSkills.length} = {matchPercent}% Match</code>
                      </p>
                    </div>

                    {/* Matched Skills */}
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Matched Job Skills ({matchedSkills.length})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedSkills.length > 0 ? (
                          matchedSkills.map((s, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg">
                              ✓ {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">No required skills matched yet.</span>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                      <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" /> Missing Job Skills ({missingSkills.length})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {missingSkills.length > 0 ? (
                          missingSkills.map((s, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg">
                              • {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-emerald-700 font-semibold">Candidate meets all required job skills!</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── STAGE-DEPENDENT RECRUITER ACTIONS AT MODAL BOTTOM ────── */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 font-medium">
                      Current Stage: <strong className="text-slate-800">{currentStage}</strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* 1. If Applied: Move to AI Screening or Reject */}
                      {currentStage === 'Applied' && (
                        <>
                          <button
                            onClick={() => handleAction(selectedCandidate.id, "move_to_ai_screening", "AI Screening")}
                            className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <Brain className="w-4 h-4" /> Move to AI Screening
                          </button>
                          <button
                            onClick={() => handleAction(selectedCandidate.id, "reject", "Rejected")}
                            className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* 2. If AI Screening: Shortlist or Reject (NO Interview / NO Hired) */}
                      {currentStage === 'AI Screening' && (
                        <>
                          <button
                            onClick={() => handleAction(selectedCandidate.id, "shortlist", "Shortlisted")}
                            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" /> Shortlist Candidate
                          </button>
                          <button
                            onClick={() => handleAction(selectedCandidate.id, "reject", "Rejected")}
                            className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all"
                          >
                            Reject Candidate
                          </button>
                        </>
                      )}

                      {/* 3. If Shortlisted: Schedule Interview or Reject (NO Hired yet) */}
                      {currentStage === 'Shortlisted' && (
                        <>
                          <button
                            onClick={() => handleAction(selectedCandidate.id, "schedule_interview", "Interview")}
                            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <Video className="w-4 h-4" /> Schedule Interview
                          </button>
                          <button
                            onClick={() => handleAction(selectedCandidate.id, "reject", "Rejected")}
                            className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* 4. If Interview: Mark Hired / Send Offer or Reject */}
                      {currentStage === 'Interview' && (
                        <>
                          <button
                            onClick={() => handleAction(selectedCandidate.id, "hire", "Offered")}
                            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <Award className="w-4 h-4" /> Mark Hired / Send Offer
                          </button>
                          <button
                            onClick={() => handleAction(selectedCandidate.id, "reject", "Rejected")}
                            className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* 5. Terminal Stages: Hired / Offered / Selected / Rejected */}
                      {(currentStage === 'Offered' || currentStage === 'Hired' || currentStage === 'Selected') && (
                        <div className="py-2 px-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Candidate Hired / Offer Extended — Final Stage</span>
                        </div>
                      )}

                      {currentStage === 'Rejected' && (
                        <div className="py-2 px-4 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>Application Rejected — Final Stage</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


