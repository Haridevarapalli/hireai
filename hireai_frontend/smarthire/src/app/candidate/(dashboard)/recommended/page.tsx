"use client";

import React from "react";
import RecommendedJobs from "@/components/RecommendedJobs";
import MissingSkillsSuggestions from "@/components/MissingSkillsSuggestions";

export default function RecommendedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Recommended Jobs</h1>
        <p className="text-sm text-slate-500 mt-1">
          AI-matched opportunities based on your skills and experience
        </p>
      </div>
      <RecommendedJobs />
      <MissingSkillsSuggestions />
    </div>
  );
}
