"use client";

import React from "react";
import { motion } from "framer-motion";
import { appliedJobsDetailed } from "@/lib/data";
import {
  MapPin,
  DollarSign,
  Calendar,
  ExternalLink,
  Check,
  Clock,
  X,
  Filter,
} from "lucide-react";

function getStatusStyle(status: string) {
  switch (status) {
    case "Interview Scheduled":
      return { bg: "bg-green-50", text: "text-green-600", border: "border-green-100", icon: Check };
    case "AI Screening":
      return { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", icon: Clock };
    case "Under Review":
      return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", icon: Clock };
    case "Applied":
      return { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", icon: Clock };
    case "Rejected":
      return { bg: "bg-red-50", text: "text-red-500", border: "border-red-100", icon: X };
    default:
      return { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", icon: Clock };
  }
}

export default function AppliedJobsPage() {
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
            {appliedJobsDetailed.length} applications
          </span>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Applied", value: 5, color: "#3b82f6" },
          { label: "Under Review", value: 1, color: "#f59e0b" },
          { label: "AI Screening", value: 1, color: "#8b5cf6" },
          { label: "Interview", value: 1, color: "#22c55e" },
          { label: "Rejected", value: 1, color: "#ef4444" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-slate-100 p-3 text-center"
            style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
          >
            <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {appliedJobsDetailed.map((job, i) => {
          const style = getStatusStyle(job.status);
          const StatusIcon = style.icon;
          return (
            <motion.div
              key={job.id}
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
                    style={{ backgroundColor: job.logoColor }}
                  >
                    {job.logo}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{job.company}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <DollarSign className="w-3 h-3" />
                        {job.salary}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        Applied {job.appliedDate}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
                    <StatusIcon className="w-3 h-3" />
                    {job.status}
                  </div>
                  <div
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      job.matchScore >= 85
                        ? "bg-green-50 text-green-600"
                        : job.matchScore >= 75
                        ? "bg-blue-50 text-blue-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {job.matchScore}% Match
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  {["Applied", "Screened", "Reviewed", "Interview", "Offered"].map((step, stepIdx) => {
                    const currentStep = job.status === "Rejected" ? -1 :
                      job.status === "Applied" ? 0 :
                      job.status === "AI Screening" ? 1 :
                      job.status === "Under Review" ? 2 :
                      job.status === "Interview Scheduled" ? 3 : 0;
                    const isCompleted = stepIdx <= currentStep;
                    const isRejected = job.status === "Rejected";

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
        })}
      </div>
    </div>
  );
}
