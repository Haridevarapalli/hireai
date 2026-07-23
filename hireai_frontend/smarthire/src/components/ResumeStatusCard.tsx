"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileText, UploadCloud, CheckCircle, Eye, RefreshCw, AlertCircle } from "lucide-react";
import { uploadResume } from "@/actions/resumeActions";
import Link from "next/link";

interface ResumeStatusCardProps {
  hasResume: boolean;
  resume: any | null;
  onUploadSuccess: () => void;
}

export default function ResumeStatusCard({ hasResume, resume, onUploadSuccess }: ResumeStatusCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadResume(formData);
    if (result.success) {
      onUploadSuccess();
    }
    setIsUploading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
      style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
    >
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          <h2 className="text-base font-bold text-slate-800">Resume Status</h2>
        </div>
        {hasResume ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
            <CheckCircle className="w-3.5 h-3.5" />
            Uploaded ✓
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Not Uploaded
          </div>
        )}
      </div>

      <div className="p-6">
        {!hasResume ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">No Resume Uploaded</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-[250px]">
              Upload your resume to calculate your ATS score and unlock personalized job recommendations.
            </p>
            
            <input 
              type="file" 
              accept=".pdf,.doc,.docx" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-colors disabled:opacity-70"
            >
              <UploadCloud className="w-4 h-4" />
              {isUploading ? "Uploading..." : "Upload Resume"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">File Name</p>
                <h3 className="text-sm font-bold text-slate-800 mb-2 truncate max-w-[200px] md:max-w-[300px]">
                  {resume.fileName || 'resume.pdf'}
                </h3>
                <div className="flex items-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Uploaded On</p>
                    <p className="text-xs font-semibold text-slate-600">
                      {resume.createdAt ? new Date(resume.createdAt).toLocaleDateString("en-GB", {
                        day: 'numeric', month: 'long', year: 'numeric'
                      }) : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <input 
                type="file" 
                accept=".pdf,.doc,.docx" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 text-sm font-semibold rounded-xl transition-colors disabled:opacity-70"
              >
                <RefreshCw className={`w-4 h-4 ${isUploading ? "animate-spin" : ""}`} />
                {isUploading ? "Replacing..." : "Replace Resume"}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
