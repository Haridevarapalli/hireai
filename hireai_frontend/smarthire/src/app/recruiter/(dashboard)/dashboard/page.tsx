"use client";

import React, { useEffect, useState } from "react";
import StatsCard from "@/components/StatsCard";
import ApplicantTrendsChart from "@/components/charts/ApplicantTrendsChart";
import ApplicantSourcesChart from "@/components/charts/ApplicantSourcesChart";
import RecentApplicantsTable from "@/components/RecentApplicantsTable";
import TopSkillsDemand from "@/components/TopSkillsDemand";
import AIInsightsPanel from "@/components/AIInsightsPanel";
import { recruiterStats } from "@/lib/data";
import { getUserSession } from "@/actions/authActions";
import { SessionPayload } from "@/lib/auth";

export default function RecruiterDashboard() {
  const [session, setSession] = useState<SessionPayload | null>(null);

  useEffect(() => {
    getUserSession().then(setSession);
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
          Welcome back, {session?.name || "Recruiter"}! 👋
        </h1>
        <p className="text-slate-500">
          Here&apos;s what&apos;s happening at {session?.role === 'recruiter' ? 'your company' : 'your dashboard'} today.
        </p>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {recruiterStats.map((stat, i) => (
          <StatsCard key={stat.id} {...stat} index={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ApplicantTrendsChart />
        </div>
        <div>
          <ApplicantSourcesChart />
        </div>
      </div>

      {/* Table */}
      <RecentApplicantsTable />

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopSkillsDemand />
        <AIInsightsPanel />
      </div>
    </div>
  );
}
