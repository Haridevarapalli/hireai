"use client";

import React from "react";
import { motion } from "framer-motion";
import { recentApplicants } from "@/lib/data";
import { MoreHorizontal, Eye } from "lucide-react";

function getStatusStyle(status: string) {
  switch (status) {
    case "Shortlisted":
      return "bg-green-50 text-green-600 border-green-100";
    case "AI Screening":
      return "bg-blue-50 text-blue-600 border-blue-100";
    case "Interview":
      return "bg-purple-50 text-purple-600 border-purple-100";
    case "Applied":
      return "bg-slate-50 text-slate-600 border-slate-100";
    default:
      return "bg-slate-50 text-slate-500 border-slate-100";
  }
}

function getScoreColor(score: number) {
  if (score >= 90) return "#22c55e";
  if (score >= 80) return "#3b82f6";
  if (score >= 70) return "#f59e0b";
  return "#ef4444";
}

export default function RecentApplicantsTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
      style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Recent Applicants</h3>
          <p className="text-xs text-slate-400 mt-0.5">Latest candidates in the pipeline</p>
        </div>
        <button className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">
                Candidate
              </th>
              <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                Applied Role
              </th>
              <th className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                AI Match Score
              </th>
              <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                Status
              </th>
              <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                Date
              </th>
              <th className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {recentApplicants.map((applicant, i) => (
              <motion.tr
                key={applicant.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + i * 0.05 }}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group"
              >
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: applicant.avatarColor }}
                    >
                      {applicant.avatar}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {applicant.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-slate-600">{applicant.role}</span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-10 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${applicant.matchScore}%`,
                          backgroundColor: getScoreColor(applicant.matchScore),
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: getScoreColor(applicant.matchScore) }}
                    >
                      {applicant.matchScore}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusStyle(
                      applicant.status
                    )}`}
                  >
                    {applicant.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs text-slate-400">
                    {new Date(applicant.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
