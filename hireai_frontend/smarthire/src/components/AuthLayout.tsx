"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  Brain,
  Shield,
  Users,
  GraduationCap,
  Briefcase,
} from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  role: "candidate" | "recruiter";
}

const features = {
  candidate: [
    {
      icon: Brain,
      title: "AI Resume Analysis",
      desc: "Get instant feedback and scoring on your resume",
      color: "#3b82f6",
    },
    {
      icon: Shield,
      title: "Privacy Protected",
      desc: "Your data is encrypted and never shared without consent",
      color: "#22c55e",
    },
    {
      icon: Users,
      title: "Smart Job Matching",
      desc: "AI finds the perfect roles for your skills",
      color: "#8b5cf6",
    },
  ],
  recruiter: [
    {
      icon: Brain,
      title: "AI Candidate Screening",
      desc: "Instantly score and rank applicants with AI",
      color: "#8b5cf6",
    },
    {
      icon: Shield,
      title: "Bias-Free Hiring",
      desc: "Skills-first approach for fair recruitment",
      color: "#22c55e",
    },
    {
      icon: Users,
      title: "Talent Pipeline",
      desc: "Access 50K+ pre-screened candidates instantly",
      color: "#f59e0b",
    },
  ],
};

const headlines = {
  candidate: {
    badge: "Candidate Portal",
    title: "Your Dream Job",
    titleAccent: "Starts Here",
    desc: "Upload your resume, get AI-powered insights, and discover the perfect job match tailored to your skills.",
    gradient: "from-blue-500 to-cyan-400",
    orb1: "bg-blue-500/15",
    orb2: "bg-cyan-500/15",
    icon: GraduationCap,
    iconGradient: "from-blue-500 to-cyan-400",
  },
  recruiter: {
    badge: "Recruiter Portal",
    title: "Hire Smarter,",
    titleAccent: "Hire Faster",
    desc: "Post jobs, screen candidates with AI, and build exceptional teams — all from one intelligent platform.",
    gradient: "from-purple-600 to-pink-500",
    orb1: "bg-purple-500/15",
    orb2: "bg-pink-500/15",
    icon: Briefcase,
    iconGradient: "from-purple-600 to-pink-500",
  },
};

export default function AuthLayout({ children, role }: AuthLayoutProps) {
  const h = headlines[role];
  const feats = features[role];
  const RoleIcon = h.icon;

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Branding Panel ─── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          {/* Animated Orbs */}
          <motion.div
            animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0], scale: [1, 1.1, 0.9, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute top-1/4 left-1/4 w-80 h-80 ${h.orb1} rounded-full blur-[100px]`}
          />
          <motion.div
            animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0], scale: [1, 0.9, 1.1, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${h.orb2} rounded-full blur-[100px]`}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="/" className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${h.iconGradient} flex items-center justify-center shadow-lg`}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Smart<span className={`text-transparent bg-clip-text bg-gradient-to-r ${h.gradient}`}>Hire</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-[0.2em]">
                  AI Platform
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Center */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
                <RoleIcon className={`w-3.5 h-3.5 text-transparent bg-clip-text`} style={{ color: role === "candidate" ? "#3b82f6" : "#a855f7" }} />
                <span className="text-xs font-medium" style={{ color: role === "candidate" ? "#93c5fd" : "#c4b5fd" }}>
                  {h.badge}
                </span>
              </div>

              <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.15] mb-5">
                {h.title}{" "}
                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${h.gradient}`}>
                  {h.titleAccent}
                </span>
              </h2>

              <p className="text-base text-slate-400 leading-relaxed mb-10">
                {h.desc}
              </p>
            </motion.div>

            {/* Features */}
            <div className="space-y-4">
              {feats.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-0.5">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-slate-400">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-8 pt-4"
          >
            {[
              { value: "50K+", label: "Candidates" },
              { value: "500+", label: "Companies" },
              { value: "94%", label: "Match Rate" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 bg-white relative overflow-y-auto">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${h.iconGradient} flex items-center justify-center shadow-md`}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">
              Smart<span className="gradient-text">Hire</span>
              <span className="text-xs font-medium text-slate-400 ml-1">AI</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-[440px]">
          {children}
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-[11px] text-slate-400">
            © 2026 SmartHire AI ·{" "}
            <a href="#" className="hover:text-slate-600">Privacy</a> ·{" "}
            <a href="#" className="hover:text-slate-600">Terms</a>
          </p>
        </div>
      </div>
    </div>
  );
}
