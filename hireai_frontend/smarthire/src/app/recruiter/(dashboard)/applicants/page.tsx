"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, Eye, CheckCircle, XCircle, Filter, Star, ShieldAlert } from "lucide-react";
import { recentApplicants } from "@/lib/data";

export default function ApplicantsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [applicants, setApplicants] = useState(recentApplicants);

  const handleAction = (id: number, newStatus: string) => {
    setApplicants(applicants.map(app => app.id === id ? { ...app, status: newStatus } : app));
  };

  const filteredApplicants = applicants.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Applicants Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">Review candidates, ATS scores, and shortlists.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-100">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role Applied & Skills</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">ATS Score</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Match Score</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resume</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredApplicants.map((applicant) => (
                  <motion.tr 
                    key={applicant.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner"
                          style={{ backgroundColor: applicant.avatarColor }}
                        >
                          {applicant.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{applicant.name}</p>
                          <p className="text-xs text-slate-400">Applied on {new Date(applicant.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-700">{applicant.role}</p>
                      <div className="flex gap-1 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">React</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">Node.js</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-slate-700">{Math.max(65, applicant.matchScore - 12)}/100</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${applicant.matchScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{applicant.matchScore}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <a href="#" className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors">
                        <Download className="w-3.5 h-3.5" /> Resume
                      </a>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                        applicant.status === 'Shortlisted' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        applicant.status === 'Interview' ? 'bg-green-50 text-green-600 border-green-200' :
                        applicant.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                        'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        {applicant.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="View Profile" className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button title="Download Resume" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        {applicant.status !== 'Shortlisted' && applicant.status !== 'Rejected' && (
                          <>
                            <button title="Shortlist" onClick={() => handleAction(applicant.id, 'Shortlisted')} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors">
                              <Star className="w-4 h-4" />
                            </button>
                            <button title="Reject" onClick={() => handleAction(applicant.id, 'Rejected')} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
