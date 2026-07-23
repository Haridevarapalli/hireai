"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { aiInsights } from "@/lib/data";
import {
  Brain,
  Trophy,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

type TabKey = "best" | "gaps" | "recommendations";

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "best", label: "Top Candidates", icon: Trophy },
  { key: "gaps", label: "Skill Gaps", icon: AlertTriangle },
  { key: "recommendations", label: "Insights", icon: Lightbulb },
];

const trendIcon: Record<string, React.ElementType> = {
  increasing: TrendingUp,
  decreasing: TrendingDown,
  stable: Minus,
};

const trendColor: Record<string, string> = {
  increasing: "#ef4444",
  decreasing: "#22c55e",
  stable: "#94a3b8",
};

export default function AIInsightsPanel() {
  const [activeTab, setActiveTab] = useState<TabKey>("best");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
      style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-white/80" />
          <h3 className="text-base font-semibold text-white">AI Hiring Insights</h3>
        </div>
        <p className="text-xs text-white/60">
          Powered by SmartHire AI • Updated 2 hours ago
        </p>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-white/10 rounded-xl p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 min-h-[240px]">
        <AnimatePresence mode="wait">
          {activeTab === "best" && (
            <motion.div
              key="best"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {aiInsights.bestCandidates.map((candidate, i) => (
                <motion.div
                  key={candidate.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{candidate.name}</p>
                      <p className="text-xs text-slate-400">{candidate.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-500">{candidate.score}%</p>
                      <p className="text-[10px] text-slate-400">Match</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "gaps" && (
            <motion.div
              key="gaps"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {aiInsights.skillGaps.map((gap, i) => {
                const TrendIcon = trendIcon[gap.trend] || Minus;
                return (
                  <motion.div
                    key={gap.skill}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${trendColor[gap.trend]}10`,
                        }}
                      >
                        <TrendIcon
                          className="w-4 h-4"
                          style={{ color: trendColor[gap.trend] }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{gap.skill}</p>
                        <p className="text-xs text-slate-400 capitalize">{gap.trend} demand</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-400">{gap.gap}%</p>
                      <p className="text-[10px] text-slate-400">Talent Gap</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === "recommendations" && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {aiInsights.recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-100/50"
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{rec}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
