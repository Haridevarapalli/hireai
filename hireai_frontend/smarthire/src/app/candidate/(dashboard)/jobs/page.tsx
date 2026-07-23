"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Bookmark,
  Building2,
} from "lucide-react";
import { recommendedJobs } from "@/lib/data";

const allJobs = [
  ...recommendedJobs,
  {
    id: 5,
    title: "Backend Engineer",
    company: "CloudNine",
    location: "Chennai",
    salary: "₹22-32 LPA",
    matchScore: 76,
    posted: "4 days ago",
    logo: "CN",
    logoColor: "#0ea5e9",
    type: "Full-time",
    experience: "3-5 years",
  },
  {
    id: 6,
    title: "DevOps Engineer",
    company: "ScaleUp Systems",
    location: "Remote",
    salary: "₹20-28 LPA",
    matchScore: 68,
    posted: "6 days ago",
    logo: "SS",
    logoColor: "#ef4444",
    type: "Remote",
    experience: "3-6 years",
  },
  {
    id: 7,
    title: "Software Architect",
    company: "FinServe Tech",
    location: "Mumbai",
    salary: "₹40-55 LPA",
    matchScore: 72,
    posted: "2 days ago",
    logo: "FT",
    logoColor: "#d946ef",
    type: "Full-time",
    experience: "7-10 years",
  },
  {
    id: 8,
    title: "UI/UX Developer",
    company: "DesignFirst",
    location: "Bangalore",
    salary: "₹15-22 LPA",
    matchScore: 81,
    posted: "1 day ago",
    logo: "DF",
    logoColor: "#f59e0b",
    type: "Hybrid",
    experience: "2-4 years",
  },
];

export default function BrowseJobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");

  const filteredJobs = allJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "All" || job.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Browse Jobs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Discover opportunities matched to your profile
        </p>
      </div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 p-5"
        style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, company..."
              className="w-full h-11 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Full-time", "Remote", "Hybrid"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  filterType === type
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          <Sparkles className="w-3 h-3 inline text-blue-400 mr-1" />
          {filteredJobs.length} jobs found • Sorted by match score
        </p>
      </motion.div>

      {/* Job Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs
          .sort((a, b) => b.matchScore - a.matchScore)
          .map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: job.logoColor }}
                  >
                    {job.logo}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" />
                      {job.company}
                    </p>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-blue-500 transition-colors">
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                  <MapPin className="w-3 h-3" />
                  {job.location}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                  <DollarSign className="w-3 h-3" />
                  {job.salary}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                  <Briefcase className="w-3 h-3" />
                  {job.experience}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                  <Clock className="w-3 h-3" />
                  {job.posted}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      job.matchScore >= 85
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : job.matchScore >= 75
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}
                  >
                    {job.matchScore}% Match
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                    {job.type}
                  </span>
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-500 hover:text-white hover:bg-blue-500 rounded-lg border border-blue-200 hover:border-blue-500 transition-all">
                  Apply Now
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
}
