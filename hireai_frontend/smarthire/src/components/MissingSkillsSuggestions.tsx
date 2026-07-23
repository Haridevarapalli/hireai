"use client";

import React from "react";
import { motion } from "framer-motion";
import { missingSkills } from "@/lib/data";
import { AlertCircle, ArrowUpRight, BookOpen } from "lucide-react";

export default function MissingSkillsSuggestions() {
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
          <p className="text-xs text-slate-400 mt-0.5">Skills that would boost your profile</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-amber-500" />
        </div>
      </div>

      <div className="space-y-3">
        {missingSkills.map((item, i) => (
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
                    {item.importance}
                  </span>
                  <span className="text-[10px] text-green-500 font-medium">
                    {item.matchBoost} match boost
                  </span>
                </div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
