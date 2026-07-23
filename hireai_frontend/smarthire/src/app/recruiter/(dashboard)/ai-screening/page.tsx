"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Target, Award } from "lucide-react";
import { aiInsights, topSkills } from "@/lib/data";

export default function AIScreeningPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI Screening & Insights
          </h1>
          <p className="text-sm text-slate-500 mt-1">Advanced analysis of your hiring pipeline powered by AI.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top Candidates & Skill Gaps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Ranked Candidates */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Top Ranked Candidates
            </h2>
            <div className="space-y-3">
              {aiInsights.bestCandidates.map((candidate, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{candidate.name}</p>
                      <p className="text-xs text-slate-500">{candidate.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-green-50 text-green-700 font-bold text-sm border border-green-200">
                      {candidate.score}% Match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Analysis & Gaps */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Applicant Skill Analysis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {aiInsights.skillGaps.map((gap, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-slate-700">{gap.skill}</span>
                    <span className={`text-xs font-bold flex items-center gap-1 ${
                      gap.trend === 'increasing' ? 'text-red-500' :
                      gap.trend === 'decreasing' ? 'text-green-500' : 'text-slate-400'
                    }`}>
                      {gap.trend === 'increasing' && <TrendingUp className="w-3 h-3" />}
                      Gap: {gap.gap}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${gap.gap > 30 ? 'bg-red-400' : gap.gap > 20 ? 'bg-amber-400' : 'bg-blue-400'}`}
                      style={{ width: `${gap.gap}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {gap.gap}% of applicants lack this required skill.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recommendations & General Insights */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-300" />
              AI Recommendations
            </h2>
            <ul className="space-y-4 relative z-10">
              {aiInsights.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-purple-100">
                  <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Hiring Bottlenecks
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs font-bold text-amber-800 mb-1">Slow Interview Scheduling</p>
                <p className="text-xs text-amber-700">Candidates wait an average of 5 days to be scheduled after shortlisting. This increases drop-off by 18%.</p>
              </div>
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-xs font-bold text-red-800 mb-1">High Rejection Rate</p>
                <p className="text-xs text-red-700">85% of applicants for DevOps roles are rejected at screening due to missing Cloud certifications.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
