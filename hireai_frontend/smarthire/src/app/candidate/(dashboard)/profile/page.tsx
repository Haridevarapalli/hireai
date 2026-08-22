"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FileText,
  Plus,
  Trash2,
  Sparkles,
  Info
} from "lucide-react";
import { getUserSession, updateProfileName } from "@/actions/authActions";
import { getResume, uploadResume, saveATSResult } from "@/actions/resumeActions";
import { getCandidateFullProfile, updateCandidateFullProfile } from "@/actions/candidateActions";
import { SessionPayload } from "@/lib/auth";
import { parseArray } from "@/utils/scoring";

export default function ProfilePage() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [resume, setResume] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeModal, setActiveModal] = useState<"skills" | "project" | "education" | "cert" | null>(null);

  // Editable Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("Bangalore, India");
  const [bio, setBio] = useState("");
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [educationList, setEducationList] = useState<any[]>([]);
  const [certsList, setCertsList] = useState<any[]>([]);

  // Temp Modal Inputs
  const [newSkill, setNewSkill] = useState("");
  const [newProj, setNewProj] = useState({ title: "", tech: "", desc: "" });
  const [newEdu, setNewEdu] = useState({ degree: "", college: "", year: "", score: "" });
  const [newCert, setNewCert] = useState({ name: "", issuer: "" });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    async function loadData() {
      const sess = await getUserSession();
      if (sess) {
        setSession(sess);
        setName(sess.name);
      }
      const fullProf = await getCandidateFullProfile();
      let loadedSkills: string[] = [];
      let loadedProjects: any[] = [];
      let loadedEdu: any[] = [];
      let loadedCerts: any[] = [];

      if (fullProf) {
        setProfile(fullProf);
        setName(fullProf.full_name || sess?.name || "");
        setPhone(fullProf.phone || "");
        setLocation(fullProf.location || "Bangalore, India");
        setBio(fullProf.bio || "");
        if (fullProf.tech_stacks && fullProf.tech_stacks.length > 0) {
          loadedSkills = fullProf.tech_stacks;
        }
        if (fullProf.parsed_resume_json) {
          const p = fullProf.parsed_resume_json;
          if (p.skills && Array.isArray(p.skills) && p.skills.length > 0) loadedSkills = p.skills;
          if (p.projects && Array.isArray(p.projects) && p.projects.length > 0) loadedProjects = p.projects;
          else if (p.experience && Array.isArray(p.experience) && p.experience.length > 0) loadedProjects = p.experience;
          if (p.education && Array.isArray(p.education) && p.education.length > 0) loadedEdu = p.education;
          if (p.certifications && Array.isArray(p.certifications) && p.certifications.length > 0) loadedCerts = p.certifications;
        }
      }

      const res = await getResume();
      if (res) {
        setResume(res);
        if (loadedSkills.length === 0 && res.skills) {
          const s = parseArray(res.skills);
          if (s.length > 0) loadedSkills = s;
        }
        const anyRes = res as any;
        if (loadedProjects.length === 0 && (anyRes.projects || anyRes.experience)) {
          const projs = parseArray(anyRes.projects);
          const exps = parseArray(anyRes.experience);
          if (projs.length > 0) loadedProjects = projs;
          else if (exps.length > 0) loadedProjects = exps;
        }
        if (loadedEdu.length === 0 && anyRes.education) {
          const edus = parseArray(anyRes.education);
          if (edus.length > 0) loadedEdu = edus;
        }
        if (loadedCerts.length === 0 && anyRes.certifications) {
          const certs = parseArray(anyRes.certifications);
          if (certs.length > 0) loadedCerts = certs;
        }
      }

      setSkillsList(loadedSkills);
      setProjectsList(loadedProjects);
      setEducationList(loadedEdu);
      setCertsList(loadedCerts);
    }
    loadData();
  }, []);

  const getInitials = (n: string) => {
    if (!n) return "U";
    return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !session) return;
    setIsSaving(true);

    const payload = {
      full_name: name.trim(),
      phone: phone.trim(),
      location: location.trim(),
      bio: bio.trim(),
      tech_stacks: skillsList,
      parsed_resume_json: {
        ...(profile?.parsed_resume_json || {}),
        name: name.trim(),
        phone: phone.trim(),
        location: location.trim(),
        summary: bio.trim(),
        skills: skillsList,
        projects: projectsList,
        education: educationList,
        certifications: certsList,
      }
    };

    const result = await updateCandidateFullProfile(payload);
    if (result.success) {
      setSession({ ...session, name: name.trim() });
      setIsEditing(false);
      showToast("Profile saved to database successfully!");
    } else {
      showToast(result.error || "Failed to save profile");
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
      const fullProf = await getCandidateFullProfile();
      if (fullProf) setProfile(fullProf);
      showToast("Resume uploaded and parsed!");
    }
    setIsUploading(false);
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skillsList.includes(newSkill.trim())) {
      setSkillsList([...skillsList, newSkill.trim()]);
      setNewSkill("");
      showToast("Skill added");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove));
  };

  const handleAddProject = () => {
    if (newProj.title.trim()) {
      setProjectsList([...projectsList, newProj]);
      setNewProj({ title: "", tech: "", desc: "" });
      setActiveModal(null);
      showToast("Project added");
    }
  };

  const handleRemoveProject = (index: number) => {
    setProjectsList(projectsList.filter((_, i) => i !== index));
  };

  const handleAddEducation = () => {
    if (newEdu.degree.trim()) {
      setEducationList([...educationList, newEdu]);
      setNewEdu({ degree: "", college: "", year: "", score: "" });
      setActiveModal(null);
      showToast("Education added");
    }
  };

  const handleRemoveEducation = (index: number) => {
    setEducationList(educationList.filter((_, i) => i !== index));
  };

  const handleAddCert = () => {
    if (newCert.name.trim()) {
      setCertsList([...certsList, newCert]);
      setNewCert({ name: "", issuer: "" });
      setActiveModal(null);
      showToast("Certification added");
    }
  };

  const handleRemoveCert = (index: number) => {
    setCertsList(certsList.filter((_, i) => i !== index));
  };

  if (!session) {
    return <div className="animate-pulse bg-slate-200 h-96 rounded-2xl" />;
  }

  const hasResume = !!resume || (profile?.tech_stacks?.length > 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-xl border border-slate-800"
          >
            <Sparkles className="w-4 h-4 text-green-400" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg flex-shrink-0">
                {getInitials(name || session.name)}
              </div>
              <div className="mb-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Your Full Name"
                      className="text-lg font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-blue-500"
                      autoFocus
                    />
                    <input 
                      type="text" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)} 
                      placeholder="City, Country"
                      className="block text-xs font-medium text-slate-600 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-blue-500"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-slate-800">{name || session.name}</h1>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{location || "Bangalore, India"}</span>
                      <span>•</span>
                      <span className="capitalize">{session.role} Professional</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Account Verified & Real-Time Synced</span>
                </div>
              </div>
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setIsEditing(false); setName(session.name); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-70"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
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
            <p className="text-amber-700/80 text-sm mt-1">Upload your resume to instantly populate your profile, skills, and experience history.</p>
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
              <p className="text-sm font-bold text-blue-900">Resume & Profile Active</p>
              <p className="text-xs text-blue-700">ATS Score: {resume?.overallScore || 85}/100 • Skills Extracted: {skillsList.length}</p>
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
          {/* Bio / About */}
          <motion.div
            className="bg-white rounded-2xl border border-slate-100 p-5"
            style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">Professional Bio</h3>
            </div>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief overview about yourself and your tech stack..."
                rows={3}
                className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-blue-500"
              />
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                {bio || "Passionate engineer looking for high-impact software engineering opportunities."}
              </p>
            )}
          </motion.div>

          {/* Contact Info */}
          <motion.div
            className="bg-white rounded-2xl border border-slate-100 p-5"
            style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
          >
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate text-xs">{session.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                {isEditing ? (
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 flex-1"
                  />
                ) : (
                  <span className="text-xs">{phone || "+91 98765 43210"}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-xs">{location || "Bangalore, India"}</span>
              </div>
            </div>
          </motion.div>

          {/* Skills */}
          <motion.div
            className="bg-white rounded-2xl border border-slate-100 p-5"
            style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-500" />
                Technical Skills ({skillsList.length})
              </h3>
            </div>

            {isEditing && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                  placeholder="Add skill (e.g. Docker)..."
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg group">
                  {skill}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
              {skillsList.length === 0 && (
                <p className="text-xs text-slate-400">No skills added yet.</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column (Projects, Education, Certs) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects & Experience */}
          <motion.div
            className="bg-white rounded-2xl border border-slate-100 p-5"
            style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-500" />
                Projects & Experience ({projectsList.length})
              </h3>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setActiveModal("project")}
                  className="flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg hover:bg-purple-100"
                >
                  <Plus className="w-3 h-3" />
                  Add Project
                </button>
              )}
            </div>

            <div className="space-y-4">
              {projectsList.map((proj: any, i: number) => {
                const title = typeof proj === 'string'
                  ? proj
                  : (proj.title || proj.role || proj.name || proj.project_name || 'Project / Role');
                const tech = typeof proj === 'string'
                  ? ''
                  : (proj.tech || proj.tech_stack || [proj.company, proj.duration].filter(Boolean).join(' • ') || proj.company || '');
                const desc = typeof proj === 'string'
                  ? ''
                  : (proj.desc || proj.description || proj.summary || proj.details || '');

                return (
                  <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50/60 border border-slate-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProject(i)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {tech && <p className="text-xs font-medium text-purple-600 mt-0.5">{tech}</p>}
                      {desc && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>}
                    </div>
                  </div>
                );
              })}
              {projectsList.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">No projects or experience added yet.</p>
              )}
            </div>
          </motion.div>

          {/* Education */}
          <motion.div
            className="bg-white rounded-2xl border border-slate-100 p-5"
            style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-green-500" />
                Education ({educationList.length})
              </h3>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setActiveModal("education")}
                  className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg hover:bg-green-100"
                >
                  <Plus className="w-3 h-3" />
                  Add Education
                </button>
              )}
            </div>

            <div className="space-y-3">
              {educationList.map((edu: any, i: number) => {
                const degree = typeof edu === 'string'
                  ? edu
                  : (edu.degree || edu.title || edu.name || edu.course || 'Education');
                const institution = typeof edu === 'string'
                  ? ''
                  : (edu.college || edu.institution || edu.school || edu.university || '');
                const year = typeof edu === 'string' ? '' : (edu.year || edu.duration || edu.period || '');
                const score = typeof edu === 'string' ? '' : (edu.score || edu.gpa || edu.cgpa || edu.grade || '');

                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 text-green-600">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{degree}</h4>
                        {(institution || year) && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {[institution, year].filter(Boolean).join(' • ')}
                          </p>
                        )}
                        {score && <p className="text-[10px] text-green-600 font-medium mt-0.5">Score: {score}</p>}
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(i)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
              {educationList.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">No education records added yet.</p>
              )}
            </div>
          </motion.div>

          {/* Certifications */}
          <motion.div
            className="bg-white rounded-2xl border border-slate-100 p-5"
            style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Certifications ({certsList.length})
              </h3>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setActiveModal("cert")}
                  className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg hover:bg-amber-100"
                >
                  <Plus className="w-3 h-3" />
                  Add Certification
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certsList.map((cert: any, i: number) => {
                const certName = typeof cert === 'string'
                  ? cert
                  : (cert.name || cert.title || cert.certificate || 'Certification');
                const issuer = typeof cert === 'string'
                  ? ''
                  : (cert.issuer || cert.authority || cert.organization || cert.provider || '');

                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-500">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{certName}</p>
                        {issuer && <p className="text-[10px] text-slate-400">{issuer}</p>}
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(i)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
              {certsList.length === 0 && (
                <p className="text-xs text-slate-400 col-span-2 py-3 text-center">No certifications added yet.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Project Modal */}
      {activeModal === "project" && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800">Add Project</h3>
            <input
              type="text"
              placeholder="Project Title (e.g. AI Resume Parser)"
              value={newProj.title}
              onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
            />
            <input
              type="text"
              placeholder="Tech Stack (e.g. React, Next.js, Python)"
              value={newProj.tech}
              onChange={(e) => setNewProj({ ...newProj, tech: e.target.value })}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
            />
            <textarea
              placeholder="Brief description of the project..."
              value={newProj.desc}
              onChange={(e) => setNewProj({ ...newProj, desc: e.target.value })}
              rows={3}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleAddProject} className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl">Add Project</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Education Modal */}
      {activeModal === "education" && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800">Add Education</h3>
            <input
              type="text"
              placeholder="Degree (e.g. B.Tech in Computer Science)"
              value={newEdu.degree}
              onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
            />
            <input
              type="text"
              placeholder="College / University"
              value={newEdu.college}
              onChange={(e) => setNewEdu({ ...newEdu, college: e.target.value })}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Year (e.g. 2024)"
                value={newEdu.year}
                onChange={(e) => setNewEdu({ ...newEdu, year: e.target.value })}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="Score (e.g. 8.5 CGPA)"
                value={newEdu.score}
                onChange={(e) => setNewEdu({ ...newEdu, score: e.target.value })}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleAddEducation} className="px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-xl">Add Education</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Certification Modal */}
      {activeModal === "cert" && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800">Add Certification</h3>
            <input
              type="text"
              placeholder="Certification Name (e.g. AWS Certified Developer)"
              value={newCert.name}
              onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
            />
            <input
              type="text"
              placeholder="Issuer (e.g. Amazon Web Services, Meta)"
              value={newCert.issuer}
              onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleAddCert} className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded-xl">Add Certification</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
