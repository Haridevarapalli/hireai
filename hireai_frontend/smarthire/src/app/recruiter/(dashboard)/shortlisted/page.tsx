"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, UserMinus, Star, Eye, Video, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { getUserSession } from "@/actions/authActions";
import { SessionPayload } from "@/lib/auth";

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';

interface Candidate {
  id: number;
  name: string;
  avatar: string;
  avatarColor?: string;
  email: string;
  role: string;
  skills: string[];
  matchScore: number;
  atsScore: number;
  status: string;
}

export default function ShortlistedPage() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadShortlisted = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${DJANGO_API_URL}/recruiter/applicants`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const shortlisted = data
            .filter((item: any) => item.status === 'shortlisted')
            .map((item: any) => ({
              id: item.id,
              name: item.candidate_name || item.candidate_email.split('@')[0],
              avatar: (item.candidate_name || item.candidate_email || 'CD').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
              avatarColor: '#8b5cf6',
              email: item.candidate_email || 'candidate@example.com',
              role: item.job_title || 'Software Developer',
              skills: Array.isArray(item.skills) && item.skills.length > 0 ? item.skills : ['Python', 'SQL'],
              matchScore: item.match_score != null ? item.match_score : 75,
              atsScore: item.ats_score != null ? item.ats_score : 77,
              status: 'Shortlisted',
            }));
          setCandidates(shortlisted);
          return;
        }
      }
    } catch (e) {
      console.warn('[Shortlisted Page] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserSession().then(async (sess) => {
      setSession(sess);
      if (sess?.token) {
        await loadShortlisted(sess.token);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const moveToInterview = async (id: number) => {
    if (session?.token) {
      try {
        const res = await fetch(`${DJANGO_API_URL}/recruiter/applications/${id}/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`,
          },
          body: JSON.stringify({ action: 'schedule_interview' }),
        });
        if (!res.ok) {
          const err = await res.json();
          showToast(err.detail || 'Failed to schedule interview');
          return;
        }
      } catch (e) {
        console.warn('Action failed:', e);
      }
    }
    setCandidates(candidates.filter(c => c.id !== id));
    showToast("Candidate moved to Interview stage!");
  };

  const removeFromShortlist = async (id: number) => {
    if (session?.token) {
      try {
        const res = await fetch(`${DJANGO_API_URL}/recruiter/applications/${id}/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`,
          },
          body: JSON.stringify({ action: 'reject', reason: 'Candidate removed from shortlist.' }),
        });
        if (!res.ok) {
          const err = await res.json();
          showToast(err.detail || 'Failed to reject candidate');
          return;
        }
      } catch (e) {
        console.warn('Reject failed:', e);
      }
    }
    setCandidates(candidates.filter(c => c.id !== id));
    showToast("Candidate removed from shortlist (Rejected).");
  };

  const filtered = candidates.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500" />
            Shortlisted Candidates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Candidates who passed AI Screening. Next Stage: Schedule Interview.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search shortlisted candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all text-slate-700"
          />
        </div>
        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 hidden sm:inline-block">
          {filtered.length} Candidates Shortlisted
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map(candidate => (
            <motion.div
              key={candidate.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 border border-teal-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-sm"
                    style={{ backgroundColor: candidate.avatarColor || '#8b5cf6' }}
                  >
                    {candidate.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{candidate.name}</h3>
                    <p className="text-xs text-purple-600 font-semibold">{candidate.role}</p>
                    <p className="text-[11px] text-slate-400">{candidate.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-200 block">
                    {candidate.matchScore}% Match
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    ATS: {candidate.atsScore}/100
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {candidate.skills.slice(0, 4).map((s, idx) => (
                  <span key={idx} className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <Link
                  href={`/recruiter/applicants?selected=${candidate.id}`}
                  className="px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                  title="Review Candidate Profile"
                >
                  <Eye className="w-3.5 h-3.5" /> Review
                </Link>
                <button 
                  onClick={() => moveToInterview(candidate.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  <Video className="w-3.5 h-3.5" /> Schedule Interview
                </button>
                <button 
                  onClick={() => removeFromShortlist(candidate.id)}
                  className="p-2 text-slate-400 bg-slate-50 border border-slate-200 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Reject / Remove from shortlist"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-100">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No shortlisted candidates found.</p>
              <p className="text-xs text-slate-400 mt-1">Review AI Screened candidates in the Applicants tab to shortlist them.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

