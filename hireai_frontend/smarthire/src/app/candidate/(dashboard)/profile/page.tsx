"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Globe,
  ExternalLink,
  Edit3,
  CheckCircle,
  Award,
  Code,
  Save,
  X,
  UploadCloud,
  FileText
} from "lucide-react";
import { getUserSession, updateProfileName } from "@/actions/authActions";
import { getResume, uploadResume } from "@/actions/resumeActions";
import { SessionPayload } from "@/lib/auth";
import { parseArray } from "@/utils/scoring";

export default function ProfilePage() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [resume, setResume] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      const sess = await getUserSession();
      if (sess) {
        setSession(sess);
        setNewName(sess.name);
      }
      const res = await getResume();
      setResume(res);
    }
    loadData();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSave = async () => {
    if (!newName.trim() || !session) return;
    setIsSaving(true);
    const result = await updateProfileName(newName);
    if (result.success) {
      setSession({ ...session, name: newName });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    const result = await uploadResume(formData);
    if (result.success) {
      const res = await getResume();
      setResume(res);
    }
    setIsUploading(false);
  };

  if (!session) {
    return <div className="animate-pulse bg-slate-200 h-96 rounded-2xl" />;
  }

  const hasResume = !!resume;
  const parsedSkills = hasResume && resume.skills ? parseArray(resume.skills) : [];
  const parsedEducation = hasResume && resume.education ? parseArray(resume.education) : [];
  const parsedProjects = hasResume && resume.projects ? parseArray(resume.projects) : [];
  const parsedCertifications = hasResume && resume.certifications ? parseArray(resume.certifications) : [];

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
        style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
      >
        <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRWMGgydjM0aDI0djJIMzZ6TTAgMzRWMGgydjM0SDB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        </div>

        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
                {getInitials(session.name)}
              </div>
              <div className="mb-1">
                {isEditing ? (
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    className="text-xl font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded px-2 py-1 mb-1 focus:outline-blue-500"
                    autoFocus
                  />
                ) : (
                  <h1 className="text-xl font-bold text-slate-800">{session.name}</h1>
                )}
                <p className="text-sm text-slate-500 capitalize">{session.role} Professional</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Account Verified</span>
                </div>
              </div>
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setIsEditing(false); setNewName(session.name); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-70"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 gradient-primary text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Upload State Banner */}
      {!hasResume && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
        >
          <div>
            <h3 className="text-amber-800 font-bold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Resume Not Uploaded
            </h3>
            <p className="text-amber-700/80 text-sm mt-1">Upload your resume to instantly generate your complete profile, skills, and experience history.</p>
          </div>
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
            className="flex-shrink-0 flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-colors disabled:opacity-70"
          >
            {isUploading ? (
              "Uploading..."
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Upload Resume
              </>
            )}
          </button>
        </motion.div>
      )}

      {hasResume && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Resume Parsed Successfully</p>
              <p className="text-xs text-blue-700">ATS Score: {resume.overallScore}/100 • Skills Extracted: {parsedSkills.length}</p>
            </div>
          </div>
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
            className="text-xs font-semibold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {isUploading ? "Updating..." : "Update Resume"}
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Contact Info */}
          <motion.div
            className="bg-white rounded-2xl border border-slate-100 p-5"
            style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
          >
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Registration Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">{session.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Joined Recently</span>
              </div>
              {hasResume && resume.extractedPhone && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{resume.extractedPhone}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Skills (Only if resume exists) */}
          {hasResume && (
            <motion.div
              className="bg-white rounded-2xl border border-slate-100 p-5"
              style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
            >
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-500" />
                Extracted Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {parsedSkills.map((skill: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column (wider) */}
        {hasResume && (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Experience / Projects */}
            <motion.div
              className="bg-white rounded-2xl border border-slate-100 p-5"
              style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
            >
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-500" />
                Projects & Experience
              </h3>
              <div className="space-y-5">
                {parsedProjects.map((proj: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                      {i < parsedProjects.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <h4 className="text-sm font-semibold text-slate-700">{proj.title}</h4>
                      <p className="text-xs font-medium text-blue-600 mt-0.5">{proj.tech}</p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{proj.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Education */}
            <motion.div
              className="bg-white rounded-2xl border border-slate-100 p-5"
              style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
            >
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-green-500" />
                Education
              </h3>
              <div className="space-y-4">
                {parsedEducation.map((edu: any, i: number) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700">{edu.degree}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{edu.college} • {edu.year}</p>
                      <p className="text-xs text-slate-500 mt-1">Score: {edu.score}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Certifications */}
            <motion.div
              className="bg-white rounded-2xl border border-slate-100 p-5"
              style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
            >
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Certifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {parsedCertifications.map((cert: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <Award className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{cert.name}</p>
                      <p className="text-[10px] text-slate-400">{cert.issuer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
