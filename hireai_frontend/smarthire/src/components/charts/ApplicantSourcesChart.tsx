"use client";

import React from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { applicantSourcesData } from "@/lib/data";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { color: string };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload[0]) return null;
  const data = payload[0];
  return (
    <div className="bg-white rounded-xl shadow-float border border-slate-100 p-3">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.payload.color }}
        />
        <span className="text-sm font-medium text-slate-700">{data.name}</span>
      </div>
      <p className="text-lg font-bold text-slate-800 mt-1">{data.value}%</p>
    </div>
  );
}

export default function ApplicantSourcesChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white rounded-2xl border border-slate-100 p-6"
      style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">Applicant Sources</h3>
        <p className="text-xs text-slate-400 mt-0.5">Where candidates are coming from</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-[180px] h-[180px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={applicantSourcesData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {applicantSourcesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800">1.2K</span>
            <span className="text-[10px] text-slate-400 font-medium">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {applicantSourcesData.map((source, i) => (
            <motion.div
              key={source.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: source.color }}
                />
                <span className="text-sm text-slate-600">{source.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${source.value}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: source.color }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-8 text-right">
                  {source.value}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
