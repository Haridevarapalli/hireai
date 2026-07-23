"use client";

import React from "react";
import { motion } from "framer-motion";
import { topSkills } from "@/lib/data";
import { Zap } from "lucide-react";

export default function TopSkillsDemand() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-white rounded-2xl border border-slate-100 p-6"
      style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Top Skills In Demand</h3>
          <p className="text-xs text-slate-400 mt-0.5">Most requested skills across open roles</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <Zap className="w-4 h-4 text-amber-500" />
        </div>
      </div>

      <div className="space-y-4">
        {topSkills.map((item, i) => (
          <motion.div
            key={item.skill}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.7 + i * 0.06 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">{item.skill}</span>
                <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                  {item.openings} openings
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: item.color }}>
                {item.demand}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.demand}%` }}
                transition={{ duration: 0.8, delay: 0.7 + i * 0.06 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${item.color}, ${item.color}99)`,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
