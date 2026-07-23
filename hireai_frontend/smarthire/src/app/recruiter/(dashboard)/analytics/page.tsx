"use client";

import React from "react";
import { BarChart3, TrendingUp, Users, Target } from "lucide-react";
import ApplicantTrendsChart from "@/components/charts/ApplicantTrendsChart";
import ApplicantSourcesChart from "@/components/charts/ApplicantSourcesChart";
import TopSkillsDemand from "@/components/TopSkillsDemand";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-500" />
            Recruitment Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">Deep dive into your hiring funnel and trends.</p>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 outline-none">
            <option>Last 30 Days</option>
            <option>Last Quarter</option>
            <option>Year to Date</option>
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">1,284</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Candidates</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">26%</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Shortlist Rate</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">12 days</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Time to Hire</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">82%</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Offer Acceptance</p>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ApplicantTrendsChart />
        </div>
        <div>
          <ApplicantSourcesChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hiring Funnel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Hiring Funnel Conversion
          </h2>
          <div className="space-y-4">
            {[
              { stage: "Applied", count: 1284, percentage: 100, color: "bg-blue-500" },
              { stage: "AI Screened", count: 856, percentage: 66, color: "bg-purple-500" },
              { stage: "Shortlisted", count: 342, percentage: 26, color: "bg-amber-500" },
              { stage: "Interviewed", count: 115, percentage: 9, color: "bg-orange-500" },
              { stage: "Hired", count: 24, percentage: 2, color: "bg-green-500" },
            ].map((step, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-slate-700">{step.stage}</span>
                  <span className="font-bold text-slate-500">{step.count} ({step.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${step.color}`} style={{ width: `${step.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Skills Demand */}
        <TopSkillsDemand />
      </div>
    </div>
  );
}
