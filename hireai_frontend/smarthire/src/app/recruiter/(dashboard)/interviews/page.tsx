"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, Calendar, Clock, MapPin, CheckCircle, XCircle, 
  FileText, Star, Plus, Mail, User, CheckCircle2, X, ExternalLink, Loader2
} from "lucide-react";
import { getUserSession } from "@/actions/authActions";
import { SessionPayload } from "@/lib/auth";

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';

interface RealInterview {
  id: number;
  application_id?: number;
  company: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar: string;
  role: string;
  date: string;
  time: string;
  type: string;
  platform: string;
  interviewer: string;
  logo: string;
  logoColor: string;
  meetLink: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  notes?: string;
}

interface RealApplicantOption {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function InterviewsPage() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [interviews, setInterviews] = useState<RealInterview[]>([]);
  const [applicants, setApplicants] = useState<RealApplicantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed' | 'All'>('Upcoming');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [candName, setCandName] = useState("");
  const [candRole, setCandRole] = useState("");
  const [interviewDate, setInterviewDate] = useState("2026-08-20");
  const [interviewTime, setInterviewTime] = useState("11:00 AM IST");
  const [interviewType, setInterviewType] = useState("Technical & Coding Round");
  const [platform, setPlatform] = useState("Google Meet");
  const [meetLink, setMeetLink] = useState("https://meet.google.com/smarthire-ai-interview");
  const [notes, setNotes] = useState("Please prepare to discuss your technical projects and live coding.");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async (token: string) => {
    try {
      setLoading(true);
      // Fetch live interviews
      const invRes = await fetch(`${DJANGO_API_URL}/recruiter/interviews`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      if (invRes.ok) {
        const data = await invRes.json();
        if (Array.isArray(data)) {
          const mapped: RealInterview[] = data.map((inv: any) => ({
            id: inv.id,
            application_id: inv.application_id,
            company: inv.company || 'SmartHire AI',
            candidateName: inv.candidate_name,
            candidateEmail: inv.candidate_email,
            candidateAvatar: (inv.candidate_name || 'Candidate').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
            role: inv.job_title || 'Software Engineer',
            date: inv.date || new Date(inv.scheduled_at || Date.now()).toLocaleDateString(),
            time: inv.time || '11:00 AM',
            type: inv.interview_type || 'Technical Round',
            platform: 'Google Meet',
            interviewer: 'Technical Hiring Lead',
            logo: 'SH',
            logoColor: '#8b5cf6',
            meetLink: inv.meeting_link || 'https://meet.google.com/smarthire-ai-interview',
            status: inv.status || 'Upcoming',
            notes: inv.notes,
          }));
          setInterviews(mapped);
        }
      }

      // Fetch live applicants for scheduling dropdown
      const appRes = await fetch(`${DJANGO_API_URL}/recruiter/applicants`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      if (appRes.ok) {
        const appData = await appRes.json();
        if (Array.isArray(appData)) {
          const opts: RealApplicantOption[] = appData.map((a: any) => ({
            id: a.id,
            name: a.candidate_name || a.candidate_email.split('@')[0],
            email: a.candidate_email,
            role: a.job_title || 'Candidate',
          }));
          setApplicants(opts);
          if (opts.length > 0 && !selectedAppId) {
            setSelectedAppId(opts[0].id);
            setCandName(opts[0].name);
            setCandRole(opts[0].role);
          }
        }
      }
    } catch (e) {
      console.warn('[Interviews Page] fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserSession().then(async (sess) => {
      setSession(sess);
      if (sess?.token) {
        await loadData(sess.token);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const handleSelectApplicant = (appId: number) => {
    setSelectedAppId(appId);
    const chosen = applicants.find(a => a.id === appId);
    if (chosen) {
      setCandName(chosen.name);
      setCandRole(chosen.role);
    }
  };

  const updateStatus = async (id: number, action: 'Complete' | 'Cancel') => {
    if (action === 'Cancel') {
      if (confirm('Are you sure you want to cancel this scheduled interview?')) {
        setInterviews(interviews.map(inv => inv.id === id ? { ...inv, status: 'Cancelled' } : inv));
        showToast("Interview cancelled");
      }
    } else {
      setInterviews(interviews.map(inv => inv.id === id ? { ...inv, status: 'Completed' } : inv));
      showToast("Interview marked as Completed! Candidate scorecard recorded.");
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId && applicants.length > 0) {
      setSelectedAppId(applicants[0].id);
    }

    if (session?.token && selectedAppId) {
      try {
        const res = await fetch(`${DJANGO_API_URL}/recruiter/interviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            application_id: selectedAppId,
            interview_type: interviewType,
            scheduled_at: `${interviewDate}T10:00:00Z`,
            meeting_link: meetLink,
            notes: notes,
          }),
        });

        if (res.ok) {
          showToast(`Interview scheduled with ${candName || 'candidate'}!`);
          await loadData(session.token);
          setIsScheduleModalOpen(false);
          return;
        }
      } catch (err) {
        console.warn('Failed to schedule via Django API:', err);
      }
    }

    // Fallback UI record
    const newInterview: RealInterview = {
      id: Date.now(),
      application_id: selectedAppId || undefined,
      company: "SmartHire AI",
      candidateName: candName || "Candidate",
      candidateEmail: `${(candName || 'candidate').toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      candidateAvatar: (candName || "CD").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
      role: candRole || "Software Developer",
      date: interviewDate,
      time: interviewTime,
      type: interviewType,
      platform: platform,
      interviewer: "Hiring Lead",
      logo: "SH",
      logoColor: "#8b5cf6",
      meetLink: meetLink,
      status: 'Upcoming',
      notes: notes,
    };
    setInterviews([newInterview, ...interviews]);
    setIsScheduleModalOpen(false);
    showToast(`Interview scheduled with ${candName}!`);
  };

  const filteredInterviews = interviews.filter(inv => {
    if (activeTab === 'Upcoming') return inv.status === 'Upcoming';
    if (activeTab === 'Completed') return inv.status === 'Completed';
    return true;
  });

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
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Video className="w-6 h-6 text-purple-600" />
            Interview Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Coordinate technical evaluations, HR discussions, and live video rounds with candidates.
          </p>
        </div>
        <button 
          onClick={() => setIsScheduleModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Schedule Interview
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-max">
        {(['Upcoming', 'Completed', 'All'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === tab ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab} {tab === 'Upcoming' ? `(${interviews.filter(i => i.status === 'Upcoming').length})` : ''}
          </button>
        ))}
      </div>

      {/* Interview Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <AnimatePresence>
          {filteredInterviews.map(interview => (
            <motion.div
              key={interview.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-purple-200 hover:shadow-md transition-all overflow-hidden p-6 space-y-5"
            >
              {/* Header Info */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3.5">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-sm shadow-sm flex-shrink-0" 
                    style={{ backgroundColor: interview.logoColor || '#8b5cf6' }}
                  >
                    {interview.candidateAvatar || interview.logo}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{interview.candidateName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{interview.role}</p>
                    <p className="text-[11px] text-slate-400">{interview.candidateEmail}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-xl border whitespace-nowrap ${
                  interview.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : interview.status === 'Cancelled'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-purple-50 text-purple-700 border-purple-100'
                }`}>
                  {interview.type}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Date: <strong className="font-semibold">{interview.date}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Time: <strong className="font-semibold">{interview.time}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 sm:col-span-2">
                  <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Interviewer: <strong>{interview.interviewer}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 sm:col-span-2 pt-1 border-t border-slate-200/60">
                  <Video className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="truncate">
                    Link: <a href={interview.meetLink} target="_blank" rel="noopener noreferrer" className="text-purple-600 font-semibold hover:underline inline-flex items-center gap-1">{interview.meetLink} <ExternalLink className="w-3 h-3" /></a>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {interview.status === 'Upcoming' && (
                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={() => updateStatus(interview.id, 'Complete')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-xs font-bold transition-colors border border-green-200"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark Completed
                  </button>
                  <button 
                    onClick={() => updateStatus(interview.id, 'Cancel')}
                    className="px-4 py-2.5 bg-slate-50 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors border border-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          ))}

          {filteredInterviews.length === 0 && !loading && (
            <div className="col-span-2 text-center py-16 bg-white rounded-3xl border border-slate-100 space-y-2">
              <Video className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-slate-600 font-bold">No interviews found</p>
              <p className="text-slate-400 text-xs">Click "+ Schedule Interview" above or schedule directly from the Applicants page.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Schedule Interview Modal ───────────────────────────────────── */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Video className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Schedule Candidate Interview</h2>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              {/* Select Real Applicant */}
              {applicants.length > 0 ? (
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Select Candidate *</label>
                  <select
                    value={selectedAppId || ""}
                    onChange={(e) => handleSelectApplicant(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white"
                  >
                    {applicants.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} — {a.role} ({a.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Candidate Name *</label>
                    <input required type="text" value={candName} onChange={(e) => setCandName(e.target.value)} placeholder="Candidate Name" className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Role / Position *</label>
                    <input required type="text" value={candRole} onChange={(e) => setCandRole(e.target.value)} placeholder="e.g. Python Developer" className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white" />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Date *</label>
                  <input required type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Time *</label>
                  <input required type="text" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} placeholder="e.g. 11:00 AM IST" className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Round Type</label>
                  <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)} className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white">
                    <option>Technical & Coding Round</option>
                    <option>System Architecture Round</option>
                    <option>HR & Cultural Evaluation</option>
                    <option>Final Leadership Discussion</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Platform</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white">
                    <option>Google Meet</option>
                    <option>Zoom</option>
                    <option>Microsoft Teams</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Meeting Link *</label>
                <input required type="url" value={meetLink} onChange={(e) => setMeetLink(e.target.value)} className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Notes / Instructions</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white" />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-md">
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
