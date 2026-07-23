"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Calendar, Clock, MapPin, CheckCircle, XCircle, FileText, Star } from "lucide-react";
import { upcomingInterviews } from "@/lib/data";

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState(upcomingInterviews);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed'>('Upcoming');

  const updateStatus = (id: number, action: 'Complete' | 'Cancel') => {
    if (action === 'Cancel') {
      if(confirm('Are you sure you want to cancel this interview?')) {
        setInterviews(interviews.filter(inv => inv.id !== id));
      }
    } else {
      alert("Interview marked as Completed! Please fill out candidate evaluation.");
      setInterviews(interviews.filter(inv => inv.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-500" />
            Interview Schedules
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage upcoming technical rounds and HR discussions.</p>
        </div>
        <button className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-slate-700">
          + Schedule New
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl w-max">
        {['Upcoming', 'Completed'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence>
          {activeTab === 'Upcoming' && interviews.map(interview => (
            <motion.div
              key={interview.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: interview.logoColor }}>
                      {interview.logo}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{interview.role}</h3>
                      <p className="text-sm text-slate-500 font-medium">Candidate: <span className="text-slate-700">John Doe</span> (Placeholder)</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100">
                    {interview.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{interview.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{interview.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">Link: <a href={interview.meetLink} className="text-blue-500 hover:underline">{interview.meetLink}</a></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => updateStatus(interview.id, 'Complete')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-sm font-semibold transition-colors border border-green-200"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark Completed
                  </button>
                  <button 
                    onClick={() => updateStatus(interview.id, 'Cancel')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl text-sm font-semibold transition-colors border border-slate-200"
                  >
                    <XCircle className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {activeTab === 'Completed' && (
            <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Completed Interviews requiring Evaluation</h3>
              
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 mb-4 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-slate-800">Sarah Jenkins</h4>
                  <p className="text-sm text-slate-500">React Developer • Technical Round</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                  <Star className="w-4 h-4" /> Add Feedback
                </button>
              </div>

            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
