"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Sparkles,
  Bell,
  Shield,
  Lock,
  Eye,
  CheckCircle2,
  AlertCircle,
  Save,
  Edit3,
  X,
  Sliders,
  Download,
  Trash2,
  Check,
  Zap,
  Globe,
  Award
} from "lucide-react";
import { getUserSession, updateProfileName } from "@/actions/authActions";
import { getResume } from "@/actions/resumeActions";
import { getCandidateFullProfile, updateCandidateFullProfile, changePassword } from "@/actions/candidateActions";
import { SessionPayload } from "@/lib/auth";

export default function CandidateSettingsPage() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [resume, setResume] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "ai" | "notifications" | "security">("profile");

  // Profile Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [location, setLocation] = useState("Bangalore, India");
  const [bio, setBio] = useState("Passionate software engineer looking for high-impact full-stack and AI engineering opportunities.");
  const [isSaving, setIsSaving] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  // Job Search Preferences
  const [targetRoles, setTargetRoles] = useState<string[]>(["Full Stack Developer", "Frontend Engineer", "React Developer", "Software Engineer"]);
  const [newRoleInput, setNewRoleInput] = useState("");
  const [jobTypes, setJobTypes] = useState<{ [key: string]: boolean }>({
    "Full-time": true,
    "Remote": true,
    "Hybrid": true,
    "Contract / Internship": false,
  });
  const [salaryRange, setSalaryRange] = useState("₹15 LPA - ₹28 LPA");
  const [preferredLocations, setPreferredLocations] = useState<string[]>(["Bangalore", "Hyderabad", "Remote"]);
  const [newLocInput, setNewLocInput] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("Immediate (0 - 15 Days)");

  // AI & Matching Settings
  const [minMatchThreshold, setMinMatchThreshold] = useState(75);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);
  const [instantAlertsEnabled, setInstantAlertsEnabled] = useState(true);
  const [autoSkillsGapAudit, setAutoSkillsGapAudit] = useState(true);

  // Notification Settings
  const [notifications, setNotifications] = useState({
    applicationUpdates: true,
    interviewInvites: true,
    recruiterShortlist: true,
    aiJobMatches: true,
    weeklyDigest: false,
    smsAlerts: false,
  });

  // Security & Privacy Settings
  const [resumeVisibility, setResumeVisibility] = useState<"public" | "recruiter_only" | "private">("recruiter_only");
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function loadData() {
      const sess = await getUserSession();
      if (sess) {
        setSession(sess);
        setName(sess.name);
      }
      const fullProf = await getCandidateFullProfile();
      if (fullProf) {
        if (fullProf.full_name) setName(fullProf.full_name);
        if (fullProf.phone) setPhone(fullProf.phone);
        if (fullProf.location) setLocation(fullProf.location);
        if (fullProf.bio) setBio(fullProf.bio);
        if (fullProf.resume_visibility) setResumeVisibility(fullProf.resume_visibility);
        if (fullProf.job_preferences && Object.keys(fullProf.job_preferences).length > 0) {
          const jp = fullProf.job_preferences;
          if (jp.target_roles) setTargetRoles(jp.target_roles);
          if (jp.job_types) setJobTypes(jp.job_types);
          if (jp.salary_range) setSalaryRange(jp.salary_range);
          if (jp.preferred_locations) setPreferredLocations(jp.preferred_locations);
          if (jp.notice_period) setNoticePeriod(jp.notice_period);
        }
        if (fullProf.ai_settings && Object.keys(fullProf.ai_settings).length > 0) {
          const ai = fullProf.ai_settings;
          if (ai.min_match_threshold != null) setMinMatchThreshold(ai.min_match_threshold);
          if (ai.ai_suggestions != null) setAiSuggestionsEnabled(ai.ai_suggestions);
          if (ai.instant_alerts != null) setInstantAlertsEnabled(ai.instant_alerts);
          if (ai.auto_skills_gap != null) setAutoSkillsGapAudit(ai.auto_skills_gap);
        }
        if (fullProf.notification_settings && Object.keys(fullProf.notification_settings).length > 0) {
          setNotifications(prev => ({ ...prev, ...fullProf.notification_settings }));
        }
      }
      const res = await getResume();
      if (res) {
        setResume(res);
        if (res.extractedPhone && !fullProf?.phone) setPhone(res.extractedPhone);
      }
    }
    loadData();
  }, []);

  const showToast = (message: string) => {
    setSavedToast(message);
    setTimeout(() => {
      setSavedToast(null);
    }, 3500);
  };

  const getInitials = (n: string) => {
    if (!n) return "CA";
    return n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const res = await updateCandidateFullProfile({
      full_name: name.trim(),
      phone: phone.trim(),
      location: location.trim(),
      bio: bio.trim(),
      resume_visibility: resumeVisibility,
      job_preferences: {
        target_roles: targetRoles,
        job_types: jobTypes,
        salary_range: salaryRange,
        preferred_locations: preferredLocations,
        notice_period: noticePeriod,
      },
      ai_settings: {
        min_match_threshold: minMatchThreshold,
        ai_suggestions: aiSuggestionsEnabled,
        instant_alerts: instantAlertsEnabled,
        auto_skills_gap: autoSkillsGapAudit,
      },
      notification_settings: notifications,
    });
    if (res.success) {
      if (session) setSession({ ...session, name: name.trim() });
      showToast("All settings saved and synchronized with database!");
    } else {
      showToast(res.error || "Failed to save settings");
    }
    setIsSaving(false);
  };

  const handleSaveName = async () => {
    if (!name.trim() || !session) return;
    setIsSaving(true);
    const res = await updateCandidateFullProfile({ full_name: name.trim() });
    if (res.success) {
      setSession({ ...session, name });
      setIsEditingName(false);
      showToast("Profile name updated successfully!");
    }
    setIsSaving(false);
  };

  const handleSavePersonal = async () => {
    setIsSaving(true);
    const res = await updateCandidateFullProfile({
      full_name: name.trim(),
      phone: phone.trim(),
      location: location.trim(),
      bio: bio.trim(),
    });
    if (res.success) {
      showToast("Personal details saved to database!");
    }
    setIsSaving(false);
  };

  const handleAddRole = () => {
    if (newRoleInput.trim() && !targetRoles.includes(newRoleInput.trim())) {
      const updated = [...targetRoles, newRoleInput.trim()];
      setTargetRoles(updated);
      setNewRoleInput("");
      updateCandidateFullProfile({ job_preferences: { target_roles: updated, job_types: jobTypes, salary_range: salaryRange, preferred_locations: preferredLocations, notice_period: noticePeriod } });
      showToast("Target role added & saved");
    }
  };

  const handleRemoveRole = (roleToRemove: string) => {
    const updated = targetRoles.filter(r => r !== roleToRemove);
    setTargetRoles(updated);
    updateCandidateFullProfile({ job_preferences: { target_roles: updated, job_types: jobTypes, salary_range: salaryRange, preferred_locations: preferredLocations, notice_period: noticePeriod } });
    showToast("Role removed");
  };

  const handleAddLocation = () => {
    if (newLocInput.trim() && !preferredLocations.includes(newLocInput.trim())) {
      const updated = [...preferredLocations, newLocInput.trim()];
      setPreferredLocations(updated);
      setNewLocInput("");
      updateCandidateFullProfile({ job_preferences: { target_roles: targetRoles, job_types: jobTypes, salary_range: salaryRange, preferred_locations: updated, notice_period: noticePeriod } });
      showToast("Preferred location added & saved");
    }
  };

  const handleRemoveLocation = (locToRemove: string) => {
    const updated = preferredLocations.filter(l => l !== locToRemove);
    setPreferredLocations(updated);
    updateCandidateFullProfile({ job_preferences: { target_roles: targetRoles, job_types: jobTypes, salary_range: salaryRange, preferred_locations: updated, notice_period: noticePeriod } });
    showToast("Location removed");
  };

  const toggleJobType = (key: string) => {
    const updated = { ...jobTypes, [key]: !jobTypes[key] };
    setJobTypes(updated);
    updateCandidateFullProfile({ job_preferences: { target_roles: targetRoles, job_types: updated, salary_range: salaryRange, preferred_locations: preferredLocations, notice_period: noticePeriod } });
    showToast("Preferences updated");
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    updateCandidateFullProfile({ notification_settings: updated });
    showToast("Notification settings saved to database");
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      showToast("Please fill in current and new password");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New password and confirm password do not match");
      return;
    }
    setIsSaving(true);
    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password changed successfully in database!");
    } else {
      showToast(res.error || "Failed to change password");
    }
    setIsSaving(false);
  };


  if (!session) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-64" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
        <div className="h-96 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile & Account", icon: User },
    { id: "preferences", label: "Job Preferences", icon: Briefcase },
    { id: "ai", label: "AI & Matching", icon: Sparkles },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security & Privacy", icon: Shield },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-2xl border border-slate-700"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>{savedToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Account & Job Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Customize your candidate profile, AI matching thresholds, job preferences, and alerts.
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving All..." : "Save All Changes"}
        </button>

      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl whitespace-nowrap transition-all duration-200 relative ${
                isActive
                  ? "text-blue-600 bg-blue-50/80 font-semibold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              <span>{t.label}</span>
              {isActive && (
                <motion.div
                  layoutId="settings-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: Profile & Account ──────────────────────────────────── */}
      {activeTab === "profile" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Basic Information</h2>
                <p className="text-xs text-slate-500">Your profile details visible to recruiters</p>
              </div>
              <span className="px-3 py-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Candidate Account
              </span>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20 flex-shrink-0">
                  {getInitials(session.name)}
                </div>

                <div className="flex-1 w-full">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Full Name
                  </label>
                  {isEditingName ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 max-w-md text-sm text-slate-800 bg-slate-50 border border-blue-400 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => { setIsEditingName(false); setName(session.name); }}
                        className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-base font-semibold text-slate-800">{session.name}</span>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{session.email}</span>
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-md">VERIFIED</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Phone Number
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Current City / Region
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Profile Bio / Elevator Pitch
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSavePersonal}
                  disabled={isSaving}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Update Details"}
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      )}

      {/* ─── TAB 2: Job Preferences ────────────────────────────────────── */}
      {activeTab === "preferences" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Job Search Criteria</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Our AI matching algorithm prioritizes roles fitting these target parameters.
              </p>
            </div>

            {/* Target Job Titles */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">
                Target Roles & Titles
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {targetRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60"
                  >
                    {role}
                    <button
                      onClick={() => handleRemoveRole(role)}
                      className="hover:text-blue-900 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="Add role (e.g., Python Engineer)"
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddRole()}
                  className="flex-1 px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddRole}
                  className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs rounded-xl border border-blue-200 transition-colors"
                >
                  + Add Role
                </button>
              </div>
            </div>

            {/* Employment Types */}
            <div className="pt-4 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">
                Preferred Work Models
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(jobTypes).map(([type, enabled]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleJobType(type)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                      enabled
                        ? "bg-blue-50/70 border-blue-300 text-blue-700 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <span>{type}</span>
                    {enabled ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Salary & Notice Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">
                  Expected Compensation (CTC)
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 rounded-xl">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    className="w-full text-sm text-slate-800 bg-transparent focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">
                  Availability / Notice Period
                </label>
                <select
                  value={noticePeriod}
                  onChange={(e) => { setNoticePeriod(e.target.value); showToast("Notice period updated"); }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option>Immediate (0 - 15 Days)</option>
                  <option>1 Month (30 Days)</option>
                  <option>2 Months (60 Days)</option>
                  <option>3 Months (90 Days)</option>
                  <option>Serving Notice Period</option>
                </select>
              </div>
            </div>

            {/* Preferred Locations */}
            <div className="pt-4 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">
                Target Job Locations
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {preferredLocations.map((loc) => (
                  <span
                    key={loc}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200/60"
                  >
                    <MapPin className="w-3 h-3 text-purple-500" />
                    {loc}
                    <button
                      onClick={() => handleRemoveLocation(loc)}
                      className="hover:text-purple-900 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="Add location (e.g., Mumbai, Pune)"
                  value={newLocInput}
                  onChange={(e) => setNewLocInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddLocation()}
                  className="flex-1 px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddLocation}
                  className="px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 font-semibold text-xs rounded-xl border border-purple-200 transition-colors"
                >
                  + Add City
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── TAB 3: AI & Matching Settings ─────────────────────────────── */}
      {activeTab === "ai" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-md shadow-blue-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">AI Match Engine Configuration</h2>
                <p className="text-xs text-slate-500">Fine-tune how SmartHire AI scores and pairs you with top tech jobs.</p>
              </div>
            </div>

            {/* Threshold Slider */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Minimum Recommendation Threshold</h3>
                  <p className="text-xs text-slate-500">Only recommend jobs where your skill overlap meets or exceeds this score.</p>
                </div>
                <span className="text-lg font-bold text-blue-600 bg-white px-3 py-1 rounded-xl shadow-sm border border-blue-200">
                  {minMatchThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={minMatchThreshold}
                onChange={(e) => { setMinMatchThreshold(Number(e.target.value)); showToast(`Match threshold set to ${e.target.value}%`); }}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>40% (Broad matches)</span>
                <span>75% (Recommended)</span>
                <span>95% (Exact matches)</span>
              </div>
            </div>

            {/* AI Toggle Features */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Instant AI Job Match Alerts</p>
                    <p className="text-xs text-slate-500">Send an instant alert the moment a company posts a job with {minMatchThreshold}%+ match score.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={instantAlertsEnabled}
                    onChange={() => { setInstantAlertsEnabled(!instantAlertsEnabled); showToast("Instant alerts preference updated"); }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">ATS Keyword Gap Analysis</p>
                    <p className="text-xs text-slate-500">Automatically inspect job listings against your uploaded resume and highlight missing keywords.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSkillsGapAudit}
                    onChange={() => { setAutoSkillsGapAudit(!autoSkillsGapAudit); showToast("ATS gap audit updated"); }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Proactive Resume Improvement Tips</p>
                    <p className="text-xs text-slate-500">Receive weekly AI-generated tips on formatting, project bullet points, and high-growth technologies.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiSuggestionsEnabled}
                    onChange={() => { setAiSuggestionsEnabled(!aiSuggestionsEnabled); showToast("AI suggestions updated"); }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── TAB 4: Notifications ──────────────────────────────────────── */}
      {activeTab === "notifications" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Email & Notification Channels</h2>
              <p className="text-xs text-slate-500">Choose when and how SmartHire notifies you.</p>
            </div>

            <div className="space-y-3">
              {[
                { key: "applicationUpdates", title: "Application Status Progress", desc: "Get notified when your application moves to 'Shortlisted', 'Under Review', or 'Interview Scheduled'." },
                { key: "interviewInvites", title: "Interview Scheduling & Reminders", desc: "Receive immediate calendar invites, Google Meet/Teams links, and 1-hour pre-interview reminders." },
                { key: "recruiterShortlist", title: "Direct Recruiter Inquiries", desc: "Notify me whenever a company recruiter views my profile or sends a direct message." },
                { key: "aiJobMatches", title: "Top Job Recommendations", desc: "Curated daily digest of high-paying jobs matching my resume skills." },
                { key: "weeklyDigest", title: "Weekly Career Progress Summary", desc: "A concise summary of profile views, ATS score trends, and market skill demands." },
                { key: "smsAlerts", title: "SMS / WhatsApp Urgent Alerts", desc: "Urgent SMS notifications for interview confirmations and offer letters." },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-blue-100 transition-colors"
                >
                  <div className="pr-4">
                    <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={() => toggleNotification(item.key as keyof typeof notifications)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── TAB 5: Security & Privacy ─────────────────────────────────── */}
      {activeTab === "security" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Resume Visibility Card */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Resume & Profile Visibility</h2>
                <p className="text-xs text-slate-500">Control who can discover your candidate profile in recruiter searches.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "public", title: "Public (Recommended)", desc: "Visible to all verified corporate recruiters on SmartHire AI." },
                { id: "recruiter_only", title: "Only Applied Companies", desc: "Visible exclusively to companies where you submit an application." },
                { id: "private", title: "Private / Stealth Mode", desc: "Hide your profile from active recruiter searches." },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => { setResumeVisibility(opt.id as any); showToast("Visibility setting updated"); }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    resumeVisibility === opt.id
                      ? "bg-purple-50/70 border-purple-400 shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs font-bold ${resumeVisibility === opt.id ? "text-purple-900" : "text-slate-700"}`}>
                      {opt.title}
                    </p>
                    {resumeVisibility === opt.id && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Change Password</h2>
                <p className="text-xs text-slate-500">Ensure your account uses a secure password with letters and numbers.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handlePasswordChange}
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-70"
            >
              {isSaving ? "Updating..." : "Update Password"}
            </button>

          </div>

          {/* Data Export & Danger Zone */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-800">Data Management & Privacy</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <p className="text-sm font-semibold text-slate-800">Download Account Profile & ATS Data</p>
                <p className="text-xs text-slate-500">Export your parsed resume data, applied jobs list, and AI assessment history.</p>
              </div>
              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ user: session, resume: resume }, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `smarthire_candidate_data.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                  showToast("Data export downloaded!");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" /> Export Data (JSON)
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
