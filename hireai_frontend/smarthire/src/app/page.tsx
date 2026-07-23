"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Users,
  BarChart3,
  Shield,
  Zap,
  Star,
  GraduationCap,
  Briefcase,
  Upload,
  Search,
  FileText,
  Target,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

const stats = [
  { value: "50K+", label: "CS Freshers Screened" },
  { value: "500+", label: "Tech Recruiters" },
  { value: "94%", label: "Skill Match Accuracy" },
  { value: "3x", label: "Faster Placements" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">
              Smart<span className="gradient-text">Hire</span>
              <span className="text-xs font-medium text-slate-400 ml-1.5">AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium">
              Home
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/candidate/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors px-4 py-2"
            >
              Candidate Portal
            </Link>
            <Link
              href="/recruiter/login"
              className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl gradient-primary shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
            >
              Recruiter Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        {/* Background Blurs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-8">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-blue-600">
                Academic Project
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Design and Development of an{" "}
              <span className="gradient-text">Intelligent Hiring Application</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto mb-10 leading-relaxed">
              For Computer Science Freshers with AI-Integrated Applicant Tracking and Resume Evaluation System.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="#portals"
                className="group inline-flex items-center gap-2 text-base font-semibold text-white px-7 py-3.5 rounded-2xl gradient-primary shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
              >
                Sign Up
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#portals"
                className="inline-flex items-center gap-2 text-base font-semibold text-slate-700 px-7 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
          </motion.div>

          {/* Floating Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="inline-flex items-center gap-2 mt-12 px-4 py-2 rounded-full bg-white shadow-lg border border-slate-100"
          >
            <div className="flex -space-x-1.5">
              {["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b"].map((c, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: c }}
                >
                  {["AK", "PS", "MR", "SG"][i]}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-xs font-medium text-slate-500">
              Evaluated 10,000+ CS Resumes
            </span>
          </motion.div>
        </div>
      </section>

      {/* Hiring Illustration Section */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-8 md:p-12 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { icon: Upload, label: "Upload Resume", desc: "AI parses instantly", color: "#3b82f6" },
                { icon: Brain, label: "AI Screening", desc: "Smart scoring", color: "#8b5cf6" },
                { icon: Target, label: "Match CS Roles", desc: "94% accuracy", color: "#22c55e" },
                { icon: CheckCircle, label: "Get Hired", desc: "3x faster", color: "#f59e0b" },
              ].map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${step.color}20` }}
                  >
                    <step.icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <p className="text-sm font-semibold text-white mb-0.5">{step.label}</p>
                  <p className="text-xs text-slate-400">{step.desc}</p>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 -translate-y-1/2" style={{ left: `${25 * (i + 1)}%` }}>
                      <ArrowRight className="w-4 h-4 text-slate-600" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Portal Cards ──────────────────────────────────────────────── */}
      <section id="portals" className="py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Choose Your <span className="gradient-text">Portal</span>
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Whether you&apos;re looking for your first CS role or the perfect tech fresher, our intelligent application has you covered.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* ── Candidate Portal ── */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="relative group bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
            >
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-t-3xl" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all" />

              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Candidate Portal
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  Create your profile, upload your tech resume, discover CS roles, and
                  track applications — all powered by intelligent evaluation.
                </p>

                {/* Features */}
                <div className="space-y-2.5 mb-8">
                  {[
                    "AI Resume Scoring & Analysis",
                    "Smart Job Recommendations",
                    "Application Tracker",
                    "Interview Preparation",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <Link
                    href="/candidate/signup"
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                  >
                    Sign Up as Candidate
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/candidate/login"
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-xl font-semibold text-sm text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-all"
                  >
                    Sign In as Candidate
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* ── Recruiter Portal ── */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="relative group bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-3xl" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all" />

              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Recruiter Portal
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  Post tech roles, evaluate CS freshers&apos; resumes with AI, manage applicants, and
                  streamline your entire IT hiring pipeline.
                </p>

                <div className="space-y-2.5 mb-8">
                  {[
                    "AI-Powered Candidate Screening",
                    "Smart Applicant Tracking",
                    "Hiring Analytics Dashboard",
                    "Bias-Free Assessments",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Link
                    href="/recruiter/signup"
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-500 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                  >
                    Sign Up as Recruiter
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/recruiter/login"
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-xl font-semibold text-sm text-purple-600 bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-all"
                  >
                    Sign In as Recruiter
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50/50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Everything you need to{" "}
                <span className="gradient-text">hire smarter</span>
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Our intelligent application streamlines every step of IT hiring,
                from fresher resume screening to final offer.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Brain,
                title: "AI Resume Screening",
                desc: "Automatically parse and score resumes using advanced NLP to find the best matches.",
                color: "#3b82f6",
              },
              {
                icon: Users,
                title: "Smart Matching",
                desc: "ML-powered matching algorithms pair CS freshers with the perfect tech roles.",
                color: "#8b5cf6",
              },
              {
                icon: BarChart3,
                title: "Hiring Analytics",
                desc: "Real-time dashboards and insights to optimize your recruitment pipeline.",
                color: "#22c55e",
              },
              {
                icon: Shield,
                title: "Bias-Free Hiring",
                desc: "AI-driven assessments focused on skills and qualifications, not demographics.",
                color: "#f59e0b",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${feature.color}10` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl gradient-primary p-12 md:p-16 text-center overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to transform your hiring?
              </h2>
              <p className="text-blue-100 max-w-xl mx-auto mb-8">
                Join top tech recruiters using our Intelligent Hiring Application to 
                discover the best Computer Science freshers effortlessly.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link
                  href="/recruiter/signup"
                  className="inline-flex items-center gap-2 text-base font-semibold text-blue-600 bg-white px-7 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start Recruiting
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/candidate/signup"
                  className="inline-flex items-center gap-2 text-base font-semibold text-white border-2 border-white/30 px-7 py-3.5 rounded-2xl hover:bg-white/10 transition-all duration-300"
                >
                  Find Your Job
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">
              SmartHire AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            {["Privacy", "Terms", "Support"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            © 2026 SmartHire AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
