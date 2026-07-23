"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, UserMinus, Star } from "lucide-react";
import { recentApplicants } from "@/lib/data";

export default function ShortlistedPage() {
  const [searchTerm, setSearchTerm] = useState("");
  // Start with only shortlisted candidates
  const [candidates, setCandidates] = useState(
    recentApplicants.filter(app => app.status === "Shortlisted")
  );

  const moveToInterview = (id: number) => {
    setCandidates(candidates.filter(c => c.id !== id));
    // In a real app, this would also update the backend status to 'Interview Scheduled'
    alert("Candidate moved to Interviews!");
  };

  const removeFromShortlist = (id: number) => {
    setCandidates(candidates.filter(c => c.id !== id));
    // In a real app, this would update backend status to 'Rejected' or 'Under Review'
  };

  const filtered = candidates.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500" />
            Shortlisted Candidates
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage top candidates and schedule them for interviews.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map(candidate => (
            <motion.div
              key={candidate.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-100 to-transparent rounded-bl-full opacity-50" />
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
                    style={{ backgroundColor: candidate.avatarColor }}
                  >
                    {candidate.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{candidate.name}</h3>
                    <p className="text-xs text-slate-500">{candidate.role}</p>
                  </div>
                </div>
                <div className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded border border-green-100">
                  {candidate.matchScore}%
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded">React</span>
                <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded">Next.js</span>
                <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded">TypeScript</span>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => moveToInterview(candidate.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Calendar className="w-3.5 h-3.5" /> Schedule
                </button>
                <button 
                  onClick={() => removeFromShortlist(candidate.id)}
                  className="p-2 text-slate-400 bg-slate-50 border border-slate-200 rounded-lg hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Remove from shortlist"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-100">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No shortlisted candidates found.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
