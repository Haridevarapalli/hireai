"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  Brain,
  Star,
  Video,
  Target,
  FileText,
  Send,
  CheckCircle,
  Calendar,
  TrendingUp,
  User,
  Sparkles,
  Award,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Briefcase,
  Users,
  Brain,
  Star,
  Video,
  Target,
  FileText,
  Send,
  CheckCircle,
  Calendar,
  User,
  Sparkles,
  Award,
};

interface StatCardProps {
  label: string;
  value: number | string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
  gradient: string;
  color: string;
  suffix?: string;
  index: number;
}

export default function StatsCard({
  label,
  value,
  change,
  changeType,
  icon,
  gradient,
  color,
  suffix,
  index,
}: StatCardProps) {
  const Icon = iconMap[icon] || Briefcase;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4, boxShadow: "0 12px 24px -8px rgba(0,0,0,0.1)" }}
      className="group relative bg-white rounded-2xl border border-slate-100 p-5 cursor-pointer overflow-hidden transition-all duration-300"
      style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
    >
      {/* Background Gradient Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${color}08 0%, transparent 70%)`,
        }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</p>
          <div className="flex items-baseline gap-1">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 + 0.2 }}
              className="text-2xl font-bold text-slate-800"
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </motion.span>
            {suffix && value !== "--" && (
              <span className="text-sm font-medium text-slate-400">{suffix}</span>
            )}
          </div>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {changeType !== "neutral" && (
                <TrendingUp
                  className="w-3.5 h-3.5"
                  style={{ color: changeType === "positive" ? "#22c55e" : "#ef4444" }}
                />
              )}
              <span
                className="text-xs font-semibold"
                style={{ color: changeType === "positive" ? "#22c55e" : changeType === "neutral" ? "#94a3b8" : "#ef4444" }}
              >
                {change}
              </span>
              {changeType !== "neutral" && (
                <span className="text-xs text-slate-400">vs last month</span>
              )}
            </div>
          )}
        </div>

        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${gradient}`}
          style={{ color }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
      </div>

      {/* Bottom Accent Line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
    </motion.div>
  );
}
