"use client";

import React from "react";
import { motion } from "framer-motion";
import { applicationTimeline } from "@/lib/data";
import { Check, Clock } from "lucide-react";

const stepLabels = ["Applied", "Screened", "Reviewed", "Interview", "Offered"];

export default function ApplicationTimeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="bg-white rounded-2xl border border-slate-100 p-6"
      style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
    >
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-800">Application Status</h3>
        <p className="text-xs text-slate-400 mt-0.5">Track your application progress</p>
      </div>

      <div className="space-y-5">
        {applicationTimeline.map((app, i) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.08 }}
            className="p-4 rounded-xl bg-slate-50/80 border border-slate-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-700">{app.role}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{app.company}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${app.statusColor}15`,
                    color: app.statusColor,
                  }}
                >
                  {app.status}
                </span>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-1">
              {stepLabels.map((label, stepIndex) => {
                const isCompleted = stepIndex < app.step;
                const isCurrent = stepIndex === app.step - 1;
                return (
                  <React.Fragment key={label}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isCurrent
                            ? "bg-blue-500 text-white animate-pulse-soft"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-3 h-3" />
                        ) : isCurrent ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <span className="text-[9px]">{stepIndex + 1}</span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 w-12 text-center leading-tight">
                        {label}
                      </span>
                    </div>
                    {stepIndex < stepLabels.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 rounded-full mb-4 ${
                          stepIndex < app.step - 1 ? "bg-green-400" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400">Applied {app.date}</span>
              <button className="text-[11px] font-medium text-blue-500 hover:text-blue-600">
                View Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
