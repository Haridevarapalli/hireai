"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Edit2, Trash2, Power, Eye, Briefcase, 
  MapPin, Clock, MoreVertical, CheckCircle2, XCircle,
  DollarSign, Sparkles, Building, Filter, Check, X
} from "lucide-react";
import { getUserSession } from "@/actions/authActions";
import { SessionPayload } from "@/lib/auth";

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';

type JobStatus = 'Active' | 'Inactive' | 'Draft';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  experience: string;
  skills: string[];
  applicants: number;
  status: JobStatus;
  postedDate: string;
  description: string;
}

import { useSearchParams } from "next/navigation";

export default function JobsPage() {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formCompany, setFormCompany] = useState("SmartHire Enterprise");
  const [formDept, setFormDept] = useState("Engineering");
  const [formLocation, setFormLocation] = useState("Bangalore, India");
  const [formType, setFormType] = useState("Full-time");
  const [formSalary, setFormSalary] = useState("₹15 LPA - ₹25 LPA");
  const [formExp, setFormExp] = useState("2-4 Years");
  const [formDeadline, setFormDeadline] = useState("2026-09-30");
  const [formSkills, setFormSkills] = useState("React, TypeScript, Node.js");
  const [formDesc, setFormDesc] = useState("");
  const [formStatus, setFormStatus] = useState<JobStatus>("Active");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadJobs = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${DJANGO_API_URL}/recruiter/jobs`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mappedJobs: Job[] = data.map((j: any) => ({
            id: j.id.toString(),
            title: j.title,
            department: j.company || 'Engineering',
            location: j.location || 'Bangalore, India',
            type: j.role_type === 'FULL_TIME' ? 'Full-time' : (j.role_type === 'CONTRACT' ? 'Contract' : 'Remote'),
            salary: j.salary_min ? `₹${(j.salary_min / 100000).toFixed(0)} - ₹${(j.salary_max / 100000).toFixed(0)} LPA` : '₹15 LPA - ₹25 LPA',
            experience: '2-5 Years',
            skills: Array.isArray(j.required_skills) ? j.required_skills : ['Python', 'SQL'],
            applicants: j.applicants_count || 0,
            status: j.status === 'open' ? 'Active' : 'Inactive',
            postedDate: new Date(j.created_at || Date.now()).toLocaleDateString(),
            description: `${j.title} opening at ${j.company}.`,
          }));
          setJobs(mappedJobs);
        }
      }
    } catch (e) {
      console.warn('[Jobs Page] Django fetch warning:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserSession().then(async (sess) => {
      setSession(sess);
      if (sess?.token) {
        await loadJobs(sess.token);
      } else {
        setLoading(false);
      }
    });

    if (searchParams.get("action") === "new") {
      openCreateModal();
    }
  }, [searchParams]);

  const openCreateModal = () => {
    setEditingJob(null);
    setFormTitle("");
    setFormCompany("SmartHire Enterprise");
    setFormDept("Engineering");
    setFormLocation("Bangalore, India");
    setFormType("Full-time");
    setFormSalary("₹15 LPA - ₹25 LPA");
    setFormExp("2-4 Years");
    setFormDeadline("2026-09-30");
    setFormSkills("Python, Django, SQL");
    setFormDesc("");
    setFormStatus("Active");
    setIsModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setFormTitle(job.title);
    setFormCompany(job.department || "SmartHire Enterprise");
    setFormDept(job.department || "Engineering");
    setFormLocation(job.location);
    setFormType(job.type);
    setFormSalary(job.salary);
    setFormExp(job.experience);
    setFormDeadline("2026-09-30");
    setFormSkills(job.skills.join(", "));
    setFormDesc(job.description);
    setFormStatus(job.status);
    setIsModalOpen(true);
  };

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          j.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          j.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleStatus = async (id: string) => {
    const targetJob = jobs.find(j => j.id === id);
    const nextStatus: JobStatus = targetJob?.status === 'Active' ? 'Inactive' : 'Active';

    if (session?.token) {
      try {
        await fetch(`${DJANGO_API_URL}/recruiter/jobs/${id}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}` 
          },
          body: JSON.stringify({ status: nextStatus === 'Active' ? 'open' : 'closed' })
        });
      } catch (e) {}
    }

    setJobs(jobs.map(j => {
      if (j.id === id) {
        showToast(`Job "${j.title}" marked as ${nextStatus}`);
        return { ...j, status: nextStatus };
      }
      return j;
    }));
  };

  const deleteJob = async (id: string) => {
    const jobToDelete = jobs.find(j => j.id === id);
    if (confirm(`Are you sure you want to delete "${jobToDelete?.title}"?`)) {
      if (session?.token) {
        try {
          await fetch(`${DJANGO_API_URL}/recruiter/jobs/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${session.token}` },
          });
        } catch (e) {}
      }

      setJobs(jobs.filter(j => j.id !== id));
      showToast("Job deleted successfully");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSkills = formSkills.split(",").map(s => s.trim()).filter(Boolean);

    // Sync to Django Backend
    if (session?.token) {
      if (editingJob) {
        try {
          await fetch(`${DJANGO_API_URL}/recruiter/jobs/${editingJob.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.token}`,
            },
            body: JSON.stringify({
              title: formTitle,
              company: formCompany,
              location: formLocation,
              is_remote: formType.toLowerCase().includes('remote'),
              role_type: formType === 'Full-time' ? 'FULL_TIME' : (formType === 'Contract' ? 'CONTRACT' : 'PART_TIME'),
              required_skills: parsedSkills,
            }),
          });
          showToast(`Updated "${formTitle}"`);
          await loadJobs(session.token);
        } catch (e) {
          console.warn('[Edit Job] Django update warning:', e);
        }
      } else {
        try {
          const res = await fetch(`${DJANGO_API_URL}/recruiter/jobs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.token}`,
            },
            body: JSON.stringify({
              title: formTitle,
              company: formCompany || 'SmartHire Enterprise',
              location: formLocation,
              is_remote: formType.toLowerCase().includes('remote'),
              role_type: formType === 'Full-time' ? 'FULL_TIME' : (formType === 'Contract' ? 'CONTRACT' : 'PART_TIME'),
              salary_min: 1500000,
              salary_max: 2500000,
              currency: 'INR',
              required_skills: parsedSkills,
              min_match_score: 70,
            }),
          });
          if (res.ok) {
            showToast(`Job "${formTitle}" posted successfully!`);
            await loadJobs(session.token);
          }
        } catch (e) {
          console.warn('[Create Job] Django create warning:', e);
        }
      }
    }

    setIsModalOpen(false);
    setEditingJob(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-2xl border border-slate-700"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Job Postings & Openings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create and manage corporate job requisitions, requirements, and candidate pipelines.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Create New Job
        </motion.button>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, department, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all text-slate-700"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
          {["All", "Active", "Inactive"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === status
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {status} ({status === "All" ? jobs.length : jobs.filter(j => j.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {filteredJobs.map(job => (
            <motion.div
              key={job.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-purple-200 hover:shadow-md transition-all group flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100/50 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Briefcase className="w-6 h-6" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-bold text-slate-800 group-hover:text-purple-600 transition-colors text-base">
                      {job.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      job.status === "Active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {job.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {job.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {job.type}
                    </span>
                    <span className="flex items-center gap-1 text-purple-700 font-bold">
                      <DollarSign className="w-3.5 h-3.5" />
                      {job.salary}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {job.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[11px] font-semibold rounded-md border border-slate-200/60"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end lg:self-center pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 w-full lg:w-auto justify-end">
                <button
                  onClick={() => setViewingJob(job)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </button>

                <button
                  onClick={() => openEditModal(job)}
                  className="px-3 py-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200/60 transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>

                <button
                  onClick={() => toggleStatus(job.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                    job.status === "Active"
                      ? "text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200/60"
                      : "text-green-600 bg-green-50 hover:bg-green-100 border-green-200/60"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {job.status === "Active" ? "Pause" : "Activate"}
                </button>

                <button
                  onClick={() => deleteJob(job.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}

          {filteredJobs.length === 0 && !loading && (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">No Job Postings Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                You have not created any job listings yet, or no listings match your search criteria.
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" /> Post a Job
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  {editingJob ? "Edit Job Posting" : "Post New Position"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Job Title
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Senior Full Stack Engineer"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Company
                    </label>
                    <input
                      type="text"
                      required
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      placeholder="e.g. SmartHire AI Technologies"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Location
                    </label>
                    <input
                      type="text"
                      required
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="e.g. Bangalore, India"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Employment Type
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 text-slate-800"
                    >
                      <option>Full-time</option>
                      <option>Contract</option>
                      <option>Part-time</option>
                      <option>Remote</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Salary Range
                    </label>
                    <input
                      type="text"
                      required
                      value={formSalary}
                      onChange={(e) => setFormSalary(e.target.value)}
                      placeholder="e.g. ₹18 LPA - ₹28 LPA"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Experience Required
                    </label>
                    <input
                      type="text"
                      required
                      value={formExp}
                      onChange={(e) => setFormExp(e.target.value)}
                      placeholder="e.g. 2-5 Years"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Application Deadline
                    </label>
                    <input
                      type="date"
                      required
                      value={formDeadline}
                      onChange={(e) => setFormDeadline(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Required Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={formSkills}
                    onChange={(e) => setFormSkills(e.target.value)}
                    placeholder="React, TypeScript, Next.js, Python, AWS"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Job Description & Role Summary
                  </label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Describe role responsibilities, tech stacks, and team culture..."
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/20"
                  >
                    {editingJob ? "Save Changes" : "Publish Job Opening"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {viewingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100"
            >
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{viewingJob.title}</h2>
                  <p className="text-xs text-purple-600 font-semibold mt-0.5">{viewingJob.department} • {viewingJob.location}</p>
                </div>
                <button
                  onClick={() => setViewingJob(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 py-4 text-sm text-slate-600">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Compensation & Type</h4>
                  <p>{viewingJob.salary} • {viewingJob.type} • {viewingJob.experience}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Required Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingJob.skills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Job Summary</h4>
                  <p className="text-xs leading-relaxed text-slate-600">{viewingJob.description}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setViewingJob(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
