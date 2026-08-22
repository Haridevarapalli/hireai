"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Search,
  ArrowRight,
  Sparkles,
  Bookmark,
  Building2,
  CheckCircle2
} from "lucide-react";
import { getRecommendedJobs, toggleSaveJob, getSavedJobs, getAppliedJobs } from "@/actions/jobActions";
import { getResume } from "@/actions/resumeActions";
import { parseArray, normalizeCandidateSkills, isRequirementMatched } from "@/utils/scoring";
import { useRouter, useSearchParams } from "next/navigation";

const companyColors: Record<string, string> = {
  A: "#ea580c",
  F: "#2563eb",
  G: "#16a34a",
  R: "#0284c7",
  I: "#0284c7",
  S: "#ea580c",
  M: "#4f46e5",
  Z: "#dc2626",
  T: "#4f46e5",
  C: "#334155",
};

export default function BrowseJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [jobs, setJobs] = useState<any[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filterType, setFilterType] = useState("All");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [rec, saved, apps, res] = await Promise.all([
        getRecommendedJobs(),
        getSavedJobs(),
        getAppliedJobs(),
        getResume(),
      ]);

      const rawCandidateSkills = res ? parseArray(res.skills) : [];
      const normalizedSkills = normalizeCandidateSkills(rawCandidateSkills);
      let matchedJobs: any[] = [];
      if (rawCandidateSkills.length > 0 && Array.isArray(rec)) {
        matchedJobs = rec.filter((job: any) => {
          if (Array.isArray(job.matchedSkills) && job.matchedSkills.length > 0) {
            return true;
          }
          const jobReqs = parseArray(job.requirements);
          if (jobReqs.length > 0) {
            return jobReqs.some((req: string) => isRequirementMatched(normalizedSkills, req));
          }
          return false;
        });
      }
      setJobs(matchedJobs);

      if (Array.isArray(saved)) {
        setSavedJobIds(new Set(saved.map((s: any) => s.id)));
      }
      if (Array.isArray(apps)) {
        setAppliedJobIds(new Set(apps.map((a: any) => a.application?.jobId || a.job?.id || a.jobId)));
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleToggleBookmark = async (e: React.MouseEvent, jobId: number) => {
    e.stopPropagation();
    const result = await toggleSaveJob(jobId);
    if (result.success) {
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (result.saved) {
          next.add(jobId);
          showToast("Job saved to your bookmarks!");
        } else {
          next.delete(jobId);
          showToast("Job removed from bookmarks.");
        }
        return next;
      });
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const title = (job.title || "").toLowerCase();
    const comp = (job.companyName || job.company || "").toLowerCase();
    const matchesSearch =
      title.includes(searchQuery.toLowerCase()) ||
      comp.includes(searchQuery.toLowerCase());
    
    if (filterType === "Saved") {
      return matchesSearch && savedJobIds.has(job.id);
    }
    const matchesFilter = filterType === "All" || job.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-xl border border-slate-800"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Browse Jobs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Discover opportunities dynamically matched to your skills from Django database
        </p>
      </div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 p-5"
        style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, company..."
              className="w-full h-11 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["All", "Full-time", "Remote", "Hybrid", "Saved"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  filterType === type
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {type} {type === "Saved" && savedJobIds.size > 0 ? `(${savedJobIds.size})` : ""}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          <Sparkles className="w-3 h-3 inline text-blue-400 mr-1" />
          {filteredJobs.length} jobs found • Sorted by real AI match score
        </p>
      </motion.div>

      {/* Job Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Loading live jobs from Django...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 p-8">
            <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">No jobs matched your filter.</p>
          </div>
        ) : (
          filteredJobs
            .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
            .map((job, i) => {
              const companyName = job.companyName || job.company || 'Enterprise';
              const firstLetter = companyName.charAt(0).toUpperCase();
              const logoColor = companyColors[firstLetter] || '#3b82f6';
              const isSaved = savedJobIds.has(job.id);
              const isApplied = appliedJobIds.has(job.id);

              return (
                <motion.div
                  key={job.id}
                  onClick={() => router.push(`/candidate/jobs/${job.id}`)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0"
                        style={{ backgroundColor: logoColor }}
                      >
                        {firstLetter}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                          {job.title}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          {companyName}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleToggleBookmark(e, job.id)}
                      title={isSaved ? "Remove Bookmark" : "Save Job"}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isSaved
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "hover:bg-slate-100 text-slate-300 hover:text-slate-600"
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-blue-600" : ""}`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <MapPin className="w-3 h-3" />
                      {job.location || 'India'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <DollarSign className="w-3 h-3" />
                      {job.salary || 'Competitive'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <Briefcase className="w-3 h-3" />
                      {job.experience || '2-5 Years'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <Clock className="w-3 h-3" />
                      {job.deadline ? `Closes ${job.deadline}` : 'Open'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          (job.matchScore || 0) >= 85
                            ? "bg-green-50 text-green-600 border border-green-100"
                            : (job.matchScore || 0) >= 70
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}
                      >
                        {job.matchScore || 80}% Match
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                        {job.type}
                      </span>
                    </div>
                    {isApplied ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/candidate/jobs/${job.id}`);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Applied ✓
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/candidate/jobs/${job.id}`);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-500 hover:text-white hover:bg-blue-500 rounded-lg border border-blue-200 hover:border-blue-500 transition-all"
                      >
                        Apply Now
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
        )}
      </div>
    </div>
  );
}
