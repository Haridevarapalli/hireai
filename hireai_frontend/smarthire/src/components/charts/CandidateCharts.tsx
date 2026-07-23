"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload[0]) return null;
  return (
    <div className="bg-white rounded-xl shadow-float border border-slate-100 p-3">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-slate-800">{payload[0].value}%</p>
    </div>
  );
}

const barColors = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#0ea5e9", "#ef4444"];

export function ResumeMatchRadar({ data, overallScore }: { data: any[]; overallScore: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-2xl border border-slate-100 p-6"
      style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">Resume Match Score</h3>
        <p className="text-xs text-slate-400 mt-0.5">How your profile matches job requirements</p>
      </div>

      <div className="h-[260px]">
        {overallScore === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: "#94a3b8" }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="text-center">
          <p className="text-2xl font-bold gradient-text">{overallScore}</p>
          <p className="text-[10px] text-slate-400 font-medium">Overall Score</p>
        </div>
        {overallScore > 0 && (
          <>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">Top 15%</p>
              <p className="text-[10px] text-slate-400 font-medium">Percentile</p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function SkillAnalysisChart({ data, hasResume }: { data: any[]; hasResume: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white rounded-2xl border border-slate-100 p-6"
      style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">Skill Analysis</h3>
        <p className="text-xs text-slate-400 mt-0.5">Extracted category proficiency</p>
      </div>

      <div className="h-[260px]">
        {!hasResume ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-sm">
            <p>No data available</p>
            <p className="text-xs mt-1">Upload your resume to generate skill analytics.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
              />
              <YAxis
                dataKey="category"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                width={85}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
                {data.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
