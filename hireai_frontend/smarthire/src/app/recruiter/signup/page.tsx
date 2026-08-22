"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle,
} from "lucide-react";
import { signup } from "@/actions/authActions";

export default function RecruiterSignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    recruiterName: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const passwordRules = [
    { test: form.password.length >= 8, label: "8+ characters" },
    { test: /[A-Z]/.test(form.password), label: "Uppercase" },
    { test: /[0-9]/.test(form.password), label: "Number" },
    { test: /[^A-Za-z0-9]/.test(form.password), label: "Special char" },
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.recruiterName.trim()) errs.recruiterName = "Recruiter name is required";
    if (!form.companyName.trim()) errs.companyName = "Company name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Minimum 8 characters";
    else if (!passwordRules.every((r) => r.test)) errs.password = "Password doesn't meet all requirements";
    if (!form.confirmPassword) errs.confirmPassword = "Confirm your password";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
    if (!agreed) errs.terms = "You must agree to the terms";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    const formData = new FormData();
    formData.append("name", form.recruiterName);
    formData.append("companyName", form.companyName);
    formData.append("email", form.email);
    formData.append("password", form.password);

    const result = await signup(formData, "recruiter");
    
    if (result?.error) {
      setErrors({ email: result.error });
      setIsLoading(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full h-12 pl-11 pr-4 text-sm bg-slate-50 border rounded-xl
     focus:outline-none focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10
     transition-all duration-200 placeholder:text-slate-400
     ${errors[field] ? "border-red-300 bg-red-50/30" : "border-slate-200"}`;

  return (
    <AuthLayout role="recruiter">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
          <Briefcase className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">
          Create Recruiter Account
        </h2>
        <p className="text-sm text-slate-500">
          Start hiring smarter with AI today
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSignUp}
        className="space-y-4"
      >
        {/* Recruiter Name */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Recruiter Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={form.recruiterName}
              onChange={(e) => set("recruiterName", e.target.value)}
              placeholder="Enter your full name"
              className={inputCls("recruiterName")}
            />
          </div>
          {errors.recruiterName && <p className="text-xs text-red-500 mt-1">{errors.recruiterName}</p>}
        </div>

        {/* Company Name */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Company Name</label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              placeholder="Your company name"
              className={inputCls("companyName")}
            />
          </div>
          {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="recruiter@company.com"
              className={inputCls("email")}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Create a strong password"
              className={`${inputCls("password")} !pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.password && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {passwordRules.map((rule) => (
                <span
                  key={rule.label}
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    rule.test ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {rule.test ? "✓" : "○"} {rule.label}
                </span>
              ))}
            </div>
          )}
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              placeholder="Re-enter your password"
              className={inputCls("confirmPassword")}
            />
            {form.confirmPassword && form.password === form.confirmPassword && (
              <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
            )}
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2.5 pt-1">
          <div
            onClick={() => { setAgreed(!agreed); setErrors((p) => ({ ...p, terms: "" })); }}
            className={`w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
              agreed ? "bg-purple-500 border-purple-500" : "border-slate-300 hover:border-slate-400"
            }`}
          >
            {agreed && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            I agree to the{" "}
            <a href="#" className="text-purple-500 font-medium hover:text-purple-600">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-purple-500 font-medium hover:text-purple-600">Privacy Policy</a>
          </p>
        </div>
        {errors.terms && <p className="text-xs text-red-500 -mt-2">{errors.terms}</p>}

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2
            bg-gradient-to-r from-purple-600 to-pink-500 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30
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
              Create Recruiter Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </motion.form>

      {/* Navigation Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center mt-6 space-y-4"
      >
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/recruiter/login" className="font-semibold text-purple-500 hover:text-purple-600 transition-colors">
            Sign In
          </Link>
        </p>

        <div className="pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500 mb-2">Are you a Candidate?</p>
          <div className="flex items-center justify-center gap-2">
            <Link href="/candidate/signup" className="inline-block text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors border border-blue-100">
              Candidate Sign Up
            </Link>
            <Link href="/candidate/login" className="inline-block text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors border border-blue-100">
              Candidate Sign In
            </Link>
          </div>
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
