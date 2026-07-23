"use client";

import React from "react";
import { motion } from "framer-motion";
import { getRecommendedJobs, seedJobs } from "@/actions/jobActions";
import { useRouter } from "next/navigation";
import { MapPin, DollarSign, Clock, ArrowRight, Sparkles } from "lucide-react";

export default function RecommendedJobs() {
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const fetchJobs = async () => {
      await seedJobs();
      const recommended = await getRecommendedJobs();
      setJobs(recommended.slice(0, 3)); // Show top 3
      setLoading(false);
    };
    fetchJobs();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
      style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <div>
            <h3 className="text-base font-semibold text-slate-800">Recommended Jobs</h3>
            <p className="text-xs text-slate-400 mt-0.5">AI-matched opportunities for you</p>
          </div>
        </div>
        <button className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50">
          Browse All
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="py-4 text-center text-xs text-slate-400">Loading recommendations...</div>
        ) : jobs.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">No jobs match your profile yet.</div>
        ) : (
          jobs.map((job, i) => (
            <motion.div
              key={job.id}
              onClick={() => router.push(`/candidate/jobs/${job.id}`)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.08 }}
              whileHover={{ y: -2 }}
              className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600"
                >
                  {job.companyName?.charAt(0) || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{job.companyName}</p>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 border border-green-100 flex-shrink-0">
                      <span className="text-xs font-bold text-green-600">{job.matchScore}% Match</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="w-3 h-3" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <DollarSign className="w-3 h-3" />
                      <span>{job.salary}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{job.experience}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-2 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors mt-1" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
