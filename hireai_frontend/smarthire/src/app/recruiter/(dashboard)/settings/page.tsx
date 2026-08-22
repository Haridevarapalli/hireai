"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Building,
  Edit3,
  CheckCircle,
  Save,
  X
} from "lucide-react";
import { getUserSession, updateProfileName } from "@/actions/authActions";
import { SessionPayload } from "@/lib/auth";

export default function RecruiterSettingsPage() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  // Company Profile State
  const [companyName, setCompanyName] = useState("SmartHire Enterprise");
  const [recruiterTitle, setRecruiterTitle] = useState("Lead Technical Recruiter");
  const [recruiterPhone, setRecruiterPhone] = useState("+91 9876543210");
  const [linkedinUrl, setLinkedinUrl] = useState("https://linkedin.com/company/smarthire");
  const [recruiterBio, setRecruiterBio] = useState("Hiring exceptional engineers and AI talent.");
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    getUserSession().then(async (res) => {
      if (res) {
        setSession(res);
        setNewName(res.name);
        if (res.token) {
          try {
            const profileRes = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api'}/recruiter/profile`, {
              headers: { 'Authorization': `Bearer ${res.token}` },
              cache: 'no-store',
            });
            if (profileRes.ok) {
              const data = await profileRes.json();
              if (data.company_name) setCompanyName(data.company_name);
              if (data.title) setRecruiterTitle(data.title);
              if (data.phone) setRecruiterPhone(data.phone);
              if (data.linkedin_url) setLinkedinUrl(data.linkedin_url);
              if (data.bio) setRecruiterBio(data.bio);
            }
          } catch (e) {
            console.warn('Failed to load recruiter profile:', e);
          }
        }
      }
    });
  }, []);

  const handleSaveCompany = async () => {
    if (!session?.token) return;
    setIsSavingCompany(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api'}/recruiter/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          company_name: companyName,
          title: recruiterTitle,
          phone: recruiterPhone,
          linkedin_url: linkedinUrl,
          bio: recruiterBio,
        }),
      });
      if (res.ok) {
        showToast("Company & recruiter profile updated successfully!");
      } else {
        showToast("Failed to update company profile");
      }
    } catch (e) {
      showToast("Network error updating company profile");
    }
    setIsSavingCompany(false);
  };

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

  if (!session) {
    return <div className="animate-pulse bg-slate-200 h-96 rounded-2xl" />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Account Settings</h1>
      
      {/* Profile Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
        style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
      >
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Profile Information</h2>
          <p className="text-sm text-slate-500">Update your account details and public profile.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {getInitials(session.name)}
            </div>
            
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Full Name</label>
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    className="flex-1 max-w-md text-sm text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-blue-500 focus:border-blue-500 transition-colors"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="text-sm font-semibold text-slate-800 px-3 py-2 bg-slate-50 rounded-lg border border-transparent max-w-md">
                  {session.name}
                </div>
              )}
            </div>
            
            <div className="flex-shrink-0 mt-4">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setIsEditing(false); setNewName(session.name); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-blue-700 disabled:opacity-70 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-semibold rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Name
                </button>
              )}
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email Address</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg max-w-md">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{session.email}</span>
                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">Email addresses cannot be changed directly.</p>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Role & Status</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg max-w-md">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600 capitalize">{session.role} Account</span>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-600 rounded-full">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Company Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
        style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
      >
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">My Company & Recruiter Profile</h2>
            <p className="text-sm text-slate-500">Update company details and hiring team bio visible to candidates.</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Company Name</label>
              <input 
                type="text" 
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)} 
                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-purple-500" 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Recruiter Designation / Role</label>
              <input 
                type="text" 
                value={recruiterTitle} 
                onChange={(e) => setRecruiterTitle(e.target.value)} 
                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-purple-500" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Official Phone Number</label>
              <input 
                type="text" 
                value={recruiterPhone} 
                onChange={(e) => setRecruiterPhone(e.target.value)} 
                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-purple-500" 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Company / LinkedIn Profile URL</label>
              <input 
                type="text" 
                value={linkedinUrl} 
                onChange={(e) => setLinkedinUrl(e.target.value)} 
                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-purple-500" 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Company & Hiring Team Bio</label>
            <textarea 
              rows={3}
              value={recruiterBio} 
              onChange={(e) => setRecruiterBio(e.target.value)} 
              className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-purple-500" 
            />
          </div>

          <button 
            onClick={handleSaveCompany}
            disabled={isSavingCompany}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-colors disabled:opacity-60"
          >
            {isSavingCompany ? "Saving Changes..." : "Save Company Profile"}
          </button>
        </div>
      </motion.div>

      {/* Security & Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
        style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
      >
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Change Password</h2>
          <p className="text-sm text-slate-500">Ensure your account is using a long, random password to stay secure.</p>
        </div>
        <div className="p-6">
          <div className="max-w-md space-y-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Current Password</label>
              <input type="password" placeholder="••••••••" className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">New Password</label>
              <input type="password" placeholder="••••••••" className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" />
            </div>
          </div>
          <button className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-200 transition-colors">
            Update Password
          </button>
        </div>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
        style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
      >
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Notification Settings</h2>
          <p className="text-sm text-slate-500">Manage how you receive alerts and updates.</p>
        </div>
        <div className="p-6 space-y-4">
          {[
            { id: "new_application", title: "New Applications", desc: "Receive an email when a candidate applies to your jobs." },
            { id: "ai_screening", title: "AI Screening Completed", desc: "Get notified when the AI finishes scoring a batch of resumes." },
            { id: "interview_updates", title: "Interview Updates", desc: "Alerts for new scheduling or candidate cancellations." }
          ].map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
