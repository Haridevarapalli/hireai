"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getAppliedJobs } from "@/actions/jobActions";
import {
  MapPin,
  DollarSign,
  Calendar,
  Check,
  Clock,
  X,
  Filter,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

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

function getStatusStyle(status: string) {
  switch (status) {
    case "Selected":
    case "Hired":
    case "Offered":
      return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", icon: Check };
    case "Interview Scheduled":
    case "Interview":
      return { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", icon: Check };
    case "Shortlisted":
      return { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-100", icon: Check };
    case "AI Screened":
    case "AI Screening":
      return { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", icon: Clock };
    case "Under Review":
    case "Applied":
      return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", icon: Clock };
    case "Rejected":
      return { bg: "bg-red-50", text: "text-red-500", border: "border-red-100", icon: X };
    default:
      return { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", icon: Clock };
  }
}

export default function AppliedJobsPage() {
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

  const totalApplied = applications.length;
  const shortlistedCount = applications.filter(
    (a) => (a.application.status || '').toLowerCase() === "shortlisted"
  ).length;
  const interviewCount = applications.filter(
    (a) => (a.application.status || '').toLowerCase().includes("interview")
  ).length;
  const hiredCount = applications.filter(
    (a) => {
      const s = (a.application.status || '').toLowerCase();
      return s === "hired" || s === "selected" || s.includes("offer");
    }
  ).length;
  const rejectedCount = applications.filter(
    (a) => (a.application.status || '').toLowerCase() === "rejected"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Applied Jobs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track all your job applications in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {totalApplied} applications
          </span>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: "Total Applied", value: totalApplied, color: "#3b82f6" },
          { label: "Shortlisted", value: shortlistedCount, color: "#f59e0b" },
          { label: "Interview", value: interviewCount, color: "#8b5cf6" },
          { label: "Hired", value: hiredCount, color: "#10b981" },
          { label: "Rejected", value: rejectedCount, color: "#ef4444" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-slate-100 p-3 text-center"
            style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
          >
            <p className="text-xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">No applications yet</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              You haven't applied to any jobs yet. Check out your recommended jobs to get started.
            </p>
            <Link href="/candidate/jobs">
              <button className="mt-6 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
                Browse Jobs
              </button>
            </Link>
          </div>
        ) : (
          applications.map(({ application, job }, i) => {
            const status = application.status;
            const style = getStatusStyle(status);
            const StatusIcon = style.icon;
            const companyName = job?.companyName || "Enterprise";
            const firstLetter = companyName.charAt(0).toUpperCase();
            const logoColor = companyColors[firstLetter] || "#3b82f6";
            const appliedDateStr = new Date(
              application.appliedAt
            ).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-blue-200 hover:shadow-md transition-all duration-300 cursor-pointer group"
                style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: logoColor }}
                    >
                      {firstLetter}
                    </div>
                    <div>
                      <Link href={`/candidate/jobs/${job?.id}`}>
                        <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {job?.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">{companyName}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {job?.location}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <DollarSign className="w-3 h-3" />
                          {job?.salary}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          Applied {appliedDateStr}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status}
                    </div>
                    <div
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        application.matchScore >= 85
                          ? "bg-green-50 text-green-600"
                          : application.matchScore >= 75
                          ? "bg-blue-50 text-blue-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {application.matchScore}% Match
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    {[
                      "Applied",
                      "Screened",
                      "Shortlisted",
                      "Interview",
                      "Hired",
                    ].map((step, stepIdx) => {
                      const isHiredOrSelected = status === "Hired" || status === "Selected" || status === "Offered";
                      const currentStep =
                        status === "Rejected"
                          ? -1
                          : status === "Applied"
                          ? 0
                          : status === "AI Screened"
                          ? 1
                          : status === "Under Review" || status === "Shortlisted"
                          ? 2
                          : status === "Interview Scheduled" || status === "Interview"
                          ? 3
                          : isHiredOrSelected
                          ? 4
                          : 0;
                      const isCompleted = stepIdx <= currentStep;
                      const isRejected = status === "Rejected";

                      return (
                        <React.Fragment key={step}>
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${
                                isRejected
                                  ? "bg-red-100 text-red-400"
                                  : isCompleted
                                  ? "bg-green-500 text-white"
                                  : "bg-slate-200 text-slate-400"
                              }`}
                            >
                              {isCompleted && !isRejected ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                stepIdx + 1
                              )}
                            </div>
                            <span className="text-[8px] text-slate-400 mt-1 w-10 text-center leading-tight hidden sm:block">
                              {step}
                            </span>
                          </div>
                          {stepIdx < 4 && (
                            <div
                              className={`flex-1 h-0.5 rounded-full mb-3 sm:mb-4 ${
                                isRejected
                                  ? "bg-red-200"
                                  : stepIdx < currentStep
                                  ? "bg-green-400"
                                  : "bg-slate-200"
                              }`}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
