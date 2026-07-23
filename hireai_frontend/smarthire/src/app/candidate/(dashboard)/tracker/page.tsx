"use client";

import React from "react";
import { motion } from "framer-motion";
import { applicationTimeline } from "@/lib/data";
import { Check, Clock, ArrowRight, Building2, MapPin, Sparkles } from "lucide-react";

const stages = ["Applied", "Under Review", "AI Screened", "Shortlisted", "Interview", "Selected"];

export default function TrackerPage() {
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
        className="bg-white rounded-2xl border border-slate-100 p-6 overflow-x-auto"
        style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
      >
        <h3 className="text-sm font-semibold text-slate-700 mb-5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          Hiring Pipeline Stages
        </h3>
        <div className="flex items-center gap-2 min-w-[600px]">
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
                  {i === 0 ? "4 apps" : i === 1 ? "1 app" : i === 2 ? "1 app" : i === 3 ? "1 app" : i === 4 ? "1 app" : "0 apps"}
                </p>
              </div>
              {i < stages.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      {/* Detailed Tracking */}
      <div className="space-y-4">
        {applicationTimeline.map((app, i) => {
          const stepLabels = ["Applied", "Under Review", "AI Screened", "Shortlisted", "Interview", "Selected"];
          return (
            <motion.div
              key={app.id}
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
                      backgroundColor: app.statusColor,
                    }}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">{app.role}</h3>
                    <p className="text-sm text-slate-500">{app.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: `${app.statusColor}15`,
                      color: app.statusColor,
                    }}
                  >
                    {app.status}
                  </span>
                  <span className="text-xs text-slate-400">Applied {app.date}</span>
                </div>
              </div>

              {/* Visual Pipeline */}
              <div className="flex items-center gap-2">
                {stepLabels.map((step, stepIdx) => {
                  const isCompleted = stepIdx < app.step;
                  const isCurrent = stepIdx === app.step - 1;
                  return (
                    <React.Fragment key={step}>
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
                          {step}
                        </span>
                      </div>
                      {stepIdx < stepLabels.length - 1 && (
                        <div
                          className={`flex-1 h-1 rounded-full mb-5 max-w-[40px] ${
                            stepIdx < app.step - 1
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
        })}
      </div>
    </div>
  );
}
