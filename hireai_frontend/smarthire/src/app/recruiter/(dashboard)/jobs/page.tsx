"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Edit2, Trash2, Power, Eye, Briefcase, 
  MapPin, Clock, MoreVertical, CheckCircle2, XCircle
} from "lucide-react";

type JobStatus = 'Active' | 'Inactive' | 'Draft';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  applicants: number;
  status: JobStatus;
  postedDate: string;
}

const initialJobs: Job[] = [
  { id: "1", title: "Senior Frontend Developer", department: "Engineering", location: "Bangalore", type: "Full-time", applicants: 45, status: "Active", postedDate: "2 days ago" },
  { id: "2", title: "Full Stack Engineer", department: "Engineering", location: "Hyderabad", type: "Full-time", applicants: 112, status: "Active", postedDate: "1 week ago" },
  { id: "3", title: "Product Designer", department: "Design", location: "Remote", type: "Contract", applicants: 28, status: "Inactive", postedDate: "2 weeks ago" },
  { id: "4", title: "DevOps Specialist", department: "Infrastructure", location: "Pune", type: "Full-time", applicants: 0, status: "Draft", postedDate: "Just now" },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = (id: string) => {
    setJobs(jobs.map(j => {
      if (j.id === id) {
        if (j.status === 'Active') return { ...j, status: 'Inactive' };
        if (j.status === 'Inactive' || j.status === 'Draft') return { ...j, status: 'Active' };
      }
      return j;
    }));
  };

  const deleteJob = (id: string) => {
    if (confirm("Are you sure you want to delete this job?")) {
      setJobs(jobs.filter(j => j.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(false);
    setEditingJob(null);
    // Simulate save
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Job Listings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your active, inactive, and drafted roles.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setEditingJob(null); setIsModalOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </motion.button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 outline-none">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Draft</option>
          </select>
        </div>
      </div>

      {/* Job Cards */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {filteredJobs.map(job => (
            <motion.div
              key={job.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            >
              {/* Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${job.status === 'Active' ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-400'}`}>
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800 mb-1">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {job.type}</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md">{job.department}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 px-4 py-2 bg-slate-50 rounded-xl sm:bg-transparent sm:p-0">
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-800">{job.applicants}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Applicants</p>
                </div>
                <div className="text-center">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    job.status === 'Active' ? 'bg-green-50 text-green-600 border border-green-200' :
                    job.status === 'Inactive' ? 'bg-red-50 text-red-600 border border-red-200' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {job.status === 'Active' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {job.status === 'Inactive' && <XCircle className="w-3.5 h-3.5" />}
                    {job.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 justify-end">
                <button title="View Details" className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  title={job.status === 'Active' ? "Deactivate" : "Activate"} 
                  onClick={() => toggleStatus(job.id)}
                  className={`p-2 rounded-lg transition-colors ${job.status === 'Active' ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button 
                  title="Edit"
                  onClick={() => { setEditingJob(job); setIsModalOpen(true); }}
                  className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button title="Delete" onClick={() => deleteJob(job.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
          {filteredJobs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No jobs found.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{editingJob ? "Edit Job" : "Create New Job"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Job Title</label>
                  <input required type="text" defaultValue={editingJob?.title} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Department</label>
                  <input required type="text" defaultValue={editingJob?.department} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Location</label>
                  <input required type="text" defaultValue={editingJob?.location} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Job Description</label>
                <textarea rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none"></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl hover:opacity-90">
                  {editingJob ? "Save Changes" : "Post Job"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
