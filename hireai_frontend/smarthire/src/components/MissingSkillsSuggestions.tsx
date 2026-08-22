"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getJobs } from "@/actions/jobActions";
import { getResume } from "@/actions/resumeActions";
import { getCandidateFullProfile } from "@/actions/candidateActions";
import { AlertCircle, ArrowUpRight, BookOpen } from "lucide-react";
import { parseArray, normalizeCandidateSkills, isRequirementMatched } from "@/utils/scoring";

interface MissingSkillItem {
  skill: string;
  importance: "High" | "Medium";
  matchBoost: string;
  count: number;
}

export default function MissingSkillsSuggestions() {
  const [missingSkillsList, setMissingSkillsList] = useState<MissingSkillItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function calculateMissingSkills() {
      try {
        const [jobsData, resumeData, profileData] = await Promise.all([
          getJobs(),
          getResume(),
          getCandidateFullProfile(),
        ]);

        const rawCandidateSkills: string[] = [];
        if (Array.isArray(profileData?.tech_stacks)) {
          rawCandidateSkills.push(...profileData.tech_stacks);
        }
        if (resumeData?.skills) {
          rawCandidateSkills.push(...parseArray(resumeData.skills));
        }
        const normalizedSkills = normalizeCandidateSkills(rawCandidateSkills);

        // Count frequency of required skills across all jobs
        const frequencyMap: Record<string, number> = {};
        jobsData.forEach((job: any) => {
          const reqs = parseArray(job.requirements);
          reqs.forEach((r: string) => {
            const clean = r.trim();
            if (!isRequirementMatched(normalizedSkills, clean)) {
              frequencyMap[clean] = (frequencyMap[clean] || 0) + 1;
            }
          });
        });

        // Convert to sorted list of missing skills
        const sorted = Object.entries(frequencyMap)
          .map(([skill, count]) => ({
            skill,
            count,
            importance: count >= 2 ? ("High" as const) : ("Medium" as const),
            matchBoost: `+${Math.min(25, count * 8)}%`,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Fallback default skills if no missing found
        if (sorted.length === 0) {
          const defaults = ["Docker", "Kubernetes", "GraphQL", "AWS", "CI/CD"];
          const filtered = defaults
            .filter((s) => !isRequirementMatched(normalizedSkills, s))
            .slice(0, 4)
            .map((s, idx) => ({
              skill: s,
              count: 1,
              importance: idx === 0 ? ("High" as const) : ("Medium" as const),
              matchBoost: `+${12 - idx * 2}%`,
            }));
          setMissingSkillsList(filtered);
        } else {
          setMissingSkillsList(sorted);
        }
      } catch (err) {
        console.warn("Failed to calculate missing skills:", err);
      } finally {
        setLoading(false);
      }
    }
    calculateMissingSkills();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-white rounded-2xl border border-slate-100 p-6"
      style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Missing Skills</h3>
          <p className="text-xs text-slate-400 mt-0.5">Skills demanded by open jobs that would boost your match score</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-amber-500" />
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">Analyzing job skill requirements...</div>
        ) : missingSkillsList.length === 0 ? (
          <div className="py-6 text-center text-xs text-green-600 font-medium">Great job! You have all the key skills required by current job openings.</div>
        ) : (
          missingSkillsList.map((item, i) => (
            <motion.div
              key={item.skill}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-amber-50/40 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{item.skill}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        item.importance === "High"
                          ? "bg-red-50 text-red-500"
                          : "bg-amber-50 text-amber-500"
                      }`}
                    >
                      {item.importance} Demand
                    </span>
                    <span className="text-[10px] text-green-600 font-medium">
                      {item.matchBoost} match boost
                    </span>
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
