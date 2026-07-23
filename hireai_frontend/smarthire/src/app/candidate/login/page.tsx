"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { login } from "@/actions/authActions";

export default function CandidateLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Minimum 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const result = await login(formData, "candidate");
    
    if (result?.error) {
      setErrors({ email: result.error });
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout role="candidate">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">
          Welcome back, Candidate!
        </h2>
        <p className="text-sm text-slate-500">
          Sign in to continue your job search
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleLogin}
        className="space-y-4"
      >
        {/* Email */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
              placeholder="you@email.com"
              className={`w-full h-12 pl-11 pr-4 text-sm bg-slate-50 border rounded-xl
                focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10
                transition-all duration-200 placeholder:text-slate-400
                ${errors.email ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
              placeholder="Enter your password"
              className={`w-full h-12 pl-11 pr-12 text-sm bg-slate-50 border rounded-xl
                focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10
                transition-all duration-200 placeholder:text-slate-400
                ${errors.password ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>

        {/* Remember / Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setRememberMe(!rememberMe)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                rememberMe ? "bg-blue-500 border-blue-500" : "border-slate-300 hover:border-slate-400"
              }`}
            >
              {rememberMe && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-xs text-slate-500">Remember me</span>
          </label>
          <a href="#" className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors">
            Forgot password?
          </a>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2
            bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30
            transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              Sign In as Candidate
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </motion.form>

      {/* Demo */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200/80"
      >
        <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          Quick Demo
        </p>
        <button
          onClick={async () => {
            setIsLoading(true);
            const { mockLogin } = await import("@/actions/authActions");
            await mockLogin("candidate");
          }}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all disabled:opacity-50"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Enter Demo Dashboard
        </button>
      </motion.div>

      {/* Navigation Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center mt-6 space-y-4"
      >
        <p className="text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/candidate/signup" className="font-semibold text-blue-500 hover:text-blue-600 transition-colors">
            Sign up as Candidate
          </Link>
        </p>
        
        <div className="pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500 mb-2">Looking to hire candidates?</p>
          <Link href="/recruiter/login" className="inline-block text-sm font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-colors border border-purple-100">
            Switch to Recruiter Login
          </Link>
        </div>

        <div className="pt-2">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
