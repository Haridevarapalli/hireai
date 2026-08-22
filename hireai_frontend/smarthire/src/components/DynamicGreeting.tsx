"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Sparkles, Upload, CheckCircle, Loader2, TrendingUp, Briefcase, Eye } from "lucide-react";
import { getUserSession } from "@/actions/authActions";
import { uploadResume, getResume } from "@/actions/resumeActions";
import { SessionPayload } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface DynamicGreetingProps {
  onUploadSuccess?: () => void;
  profileCompletion?: number;
}

function getGreeting(): { text: string; icon: string; subtext: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Good morning", icon: "☀️", subtext: "Start your day by exploring new opportunities." };
  if (hour >= 12 && hour < 17) return { text: "Good afternoon", icon: "🌤️", subtext: "Keep the momentum going — check your latest matches." };
  if (hour >= 17 && hour < 21) return { text: "Good evening", icon: "🌆", subtext: "Wind down and review your application progress." };
  return { text: "Good night", icon: "🌙", subtext: "Plan ahead for tomorrow's job hunt!" };
}

export default function DynamicGreeting({ onUploadSuccess, profileCompletion = 0 }: DynamicGreetingProps) {
  const router = useRouter();
  const [session, setSession] = useState<SessionPayload | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const greeting = getGreeting();

  useEffect(() => {
    getUserSession().then((res) => {
      if (res) setSession(res);
    });
    getResume().then(res => {
      if (res) setHasResume(true);
    });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    const result = await uploadResume(formData);
    if (result.success) {
      setHasResume(true);
      if (onUploadSuccess) onUploadSuccess();
    }
    setIsUploading(false);
  };

  if (!session) {
    return (
      <div className="relative bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl p-6 h-32 animate-pulse" />
    );
  }

  const isRecruiter = session.role === "recruiter";
  const firstName = session.name?.split(' ')[0] || session.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl p-6 overflow-hidden ${
        isRecruiter 
          ? "bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600" 
          : "bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600"
      }`}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4" />

      <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar Profile */}
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
            <span className="text-2xl font-bold text-white">
              {session.name ? session.name.substring(0, 2).toUpperCase() : '?'}
            </span>
          </div>
          
          <div>
            {/* Dynamic Greeting */}
            <h2 className="text-xl font-bold text-white">
              {greeting.text}, {firstName} {greeting.icon}
            </h2>
            <p className="text-sm text-white/80 mt-0.5">
              {isRecruiter 
                ? "Manage your hiring activities efficiently today." 
                : greeting.subtext}
            </p>
            
            {/* Profile Completion Bar (Only for candidate) */}
            {!isRecruiter && (
              <div className="mt-2 flex items-center gap-3">
                <div className="w-40 h-2 rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompletion}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className={`h-full rounded-full ${profileCompletion === 100 ? 'bg-green-300' : 'bg-white'}`}
                  />
                </div>
                <span className="text-xs text-white/80 font-medium">
                  {profileCompletion}% Profile {profileCompletion === 100 ? '✓' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isRecruiter && (
          <div className="flex items-center gap-3">
            {!hasResume ? (
              <>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 font-semibold text-sm rounded-xl hover:bg-white/90 transition-all shadow-lg disabled:opacity-70"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploading ? "Analyzing..." : "Upload Resume"}
                </motion.button>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/candidate/profile")}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/15 border border-white/25 text-white font-semibold text-sm rounded-xl hover:bg-white/25 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                View Profile
              </motion.button>

            )}
          </div>
        )}
      </div>

      {/* Quick Stats Tags */}
      <div className="relative mt-4 flex items-center gap-5 flex-wrap">
        {(isRecruiter ? [
          "Candidate Screening",
          "AI Shortlisting",
          "Interview Management",
          "Analytics Dashboard",
          "Smart Reports",
        ] : [
          "AI Resume Analysis",
          "Skill Gap Detection",
          "ATS Optimization",
          "Smart Job Matching",
          "Interview Prep",
        ]).map((feature, i) => (
          <motion.div
            key={feature}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            className="flex items-center gap-1.5 text-xs text-white/70"
          >
            <Sparkles className="w-3 h-3 text-white/50" />
            <span>{feature}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
