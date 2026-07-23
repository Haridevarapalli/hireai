"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Sparkles, Upload, CheckCircle, Loader2 } from "lucide-react";
import { getUserSession } from "@/actions/authActions";
import { uploadResume, getResume } from "@/actions/resumeActions";
import { SessionPayload } from "@/lib/auth";

interface DynamicGreetingProps {
  onUploadSuccess?: () => void;
}

export default function DynamicGreeting({ onUploadSuccess }: DynamicGreetingProps = {}) {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [greeting, setGreeting] = useState("Welcome");
  const [icon, setIcon] = useState("👋");
  const [isUploading, setIsUploading] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch session dynamically
    getUserSession().then((res) => {
      if (res) setSession(res);
    });
    getResume().then(res => {
      if (res) {
        setHasResume(true);
        setResumeData(res);
      }
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
      const updatedResume = await getResume();
      if (updatedResume) {
        setHasResume(true);
        setResumeData(updatedResume);
        if (onUploadSuccess) onUploadSuccess();
      }
    }
    setIsUploading(false);
  };

  if (!session) {
    // Skeleton or fallback while loading session
    return (
      <div className="relative bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl p-6 h-32 animate-pulse" />
    );
  }

  const isRecruiter = session.role === "recruiter";

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
            <User className="w-8 h-8 text-white" />
          </div>
          
          <div>
            {/* Dynamic Greeting */}
            <h2 className="text-xl font-bold text-white">
              Welcome Back, {session.name} 👋
            </h2>
            <p className="text-sm text-white/80 mt-0.5">
              {isRecruiter 
                ? "Manage your hiring activities efficiently today." 
                : "Ready to explore new opportunities today?"}
            </p>
            
            {/* Profile Completion Bar (Only for candidate) */}
            {!isRecruiter && (
              <div className="mt-2 flex items-center gap-3">
                <div className="w-40 h-2 rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full rounded-full bg-white"
                  />
                </div>
                <span className="text-xs text-white/80 font-medium">85% Complete</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isRecruiter && (
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/15 border border-white/25 text-white font-semibold text-sm rounded-xl hover:bg-white/25 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Profile
            </motion.button>
          </div>
        )}
      </div>

      {/* Quick AI Features Tags */}
      <div className="relative mt-4 flex items-center gap-5 flex-wrap">
        {[
          "Resume Parsing",
          "Skill Extraction",
          "ATS Score Analysis",
          "Job Matching",
          "AI Recommendations",
        ].map((feature, i) => (
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
