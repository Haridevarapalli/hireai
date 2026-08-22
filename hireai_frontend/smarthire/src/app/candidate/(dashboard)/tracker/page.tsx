"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getAppliedJobs } from "@/actions/jobActions";
import { Check, Clock, ArrowRight, Building2, Sparkles, Briefcase } from "lucide-react";
import Link from "next/link";

const stages = ["Applied", "Under Review", "AI Screened", "Shortlisted", "Interview", "Hired"];

const statusColorMap: Record<string, string> = {
  "Applied": "#94a3b8",
  "Under Review": "#f59e0b",
  "AI Screened": "#3b82f6",
  "Shortlisted": "#8b5cf6",
  "Interview Scheduled": "#22c55e",
  "Hired": "#10b981",
  "Selected": "#10b981",
  "Rejected": "#ef4444",
};

export default function TrackerPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await getAppliedJobs();
      setApplications(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const getStageCount = (index: number) => {
    switch (index) {
      case 0:
        return applications.filter(a => a.application.status === 'Applied').length;
      case 1:
        return applications.filter(a => a.application.status === 'Under Review').length;
      case 2:
        return applications.filter(a => a.application.status === 'AI Screened').length;
      case 3:
        return applications.filter(a => a.application.status === 'Shortlisted').length;
      case 4:
        return applications.filter(a => a.application.status === 'Interview Scheduled' || a.application.status.includes('Interview') || a.application.status.includes('HR') || a.application.status.includes('Tech')).length;
      case 5:
        return applications.filter(a => a.application.status === 'Hired' || a.application.status === 'Selected' || a.application.status === 'Offered').length;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Application Tracker</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visual pipeline of all your active applications
        </p>
      </div>

      {/* Pipeline Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6"
        style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
      >
        <h3 className="text-sm font-semibold text-slate-700 mb-5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          Hiring Pipeline Stages
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:items-center gap-2 sm:gap-3">
          {stages.map((stage, i) => (
            <React.Fragment key={stage}>
              <div className="flex-1 text-center">
                <div
                  className={`w-full py-3 rounded-xl text-xs font-semibold transition-all ${
                    i === 0
                      ? "bg-slate-100 text-slate-600"
                      : i === 1
                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                      : i === 2
                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                      : i === 3
                      ? "bg-purple-50 text-purple-600 border border-purple-100"
                      : i === 4
                      ? "bg-green-50 text-green-600 border border-green-100"
                      : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                  }`}
                >
                  {stage}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  {getStageCount(i)} {getStageCount(i) === 1 ? 'app' : 'apps'}
                </p>
              </div>
              {i < stages.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0 hidden md:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      {/* Detailed Tracking */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Loading tracking pipeline...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">No applications in pipeline</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              Apply to jobs to track your multi-stage evaluation pipeline in real time.
            </p>
            <Link href="/candidate/jobs">
              <button className="mt-6 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
                Explore Jobs
              </button>
            </Link>
          </div>
        ) : (
          applications.map(({ application, job }, i) => {
            const stepLabels = ["Applied", "Under Review", "AI Screened", "Shortlisted", "Interview", "Hired"];
            const status = application.status;
            const statusColor = statusColorMap[status] || "#3b82f6";
            const isHired = status === "Hired" || status === "Selected" || status === "Offered";
            const step = status === "Rejected" ? 0 :
                         status === "Applied" ? 1 :
                         status === "Under Review" ? 2 :
                         status === "AI Screened" ? 3 :
                         status === "Shortlisted" ? 4 :
                         status === "Interview Scheduled" || status === "Interview" ? 5 :
                         isHired ? 6 : 1;
            const appliedDateStr = new Date(application.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

            return (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 hover:border-blue-200 hover:shadow-md transition-all"
                style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                      style={{
                        backgroundColor: statusColor,
                      }}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">{job?.title}</h3>
                      <p className="text-sm text-slate-500">{job?.companyName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{
                        backgroundColor: `${statusColor}15`,
                        color: statusColor,
                      }}
                    >
                      {status}
                    </span>
                    <span className="text-xs text-slate-400">Applied {appliedDateStr}</span>
                  </div>
                </div>

                {/* Visual Pipeline */}
                <div className="flex items-center gap-2">
                  {stepLabels.map((sLabel, stepIdx) => {
                    const isCompleted = stepIdx < step;
                    const isCurrent = stepIdx === step - 1;
                    return (
                      <React.Fragment key={sLabel}>
                        <div className="flex flex-col items-center flex-1">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCompleted
                                ? "bg-green-500 text-white shadow-sm shadow-green-500/30"
                                : isCurrent
                                ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30 animate-pulse-soft"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-4 h-4" />
                            ) : isCurrent ? (
                              <Clock className="w-4 h-4" />
                            ) : (
                              stepIdx + 1
                            )}
                          </div>
                          <span
                            className={`text-[10px] mt-1.5 text-center leading-tight ${
                              isCompleted || isCurrent
                                ? "text-slate-600 font-medium"
                                : "text-slate-400"
                            }`}
                          >
                            {sLabel}
                          </span>
                        </div>
                        {stepIdx < stepLabels.length - 1 && (
                          <div
                            className={`flex-1 h-1 rounded-full mb-5 max-w-[40px] ${
                              stepIdx < step - 1
                                ? "bg-green-400"
                                : "bg-slate-200"
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
