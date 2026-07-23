"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Sparkles } from "lucide-react";
import { getUserSession } from "@/actions/authActions";

interface NavbarProps {
  userName: string;
  userRole: string;
  avatarInitials: string;
}

export default function Navbar({ userName, userRole, avatarInitials }: NavbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [displayName, setDisplayName] = useState(userName);
  const [displayRole, setDisplayRole] = useState(userRole);

  useEffect(() => {
    getUserSession().then((session) => {
      if (session) {
        setDisplayName(session.name);
        setDisplayRole(session.role);
      }
    });
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Welcome Message & Search */}
        <div className="flex items-center gap-6 flex-1">
          <div className="hidden md:block">
            <h2 className="text-sm font-semibold text-slate-800">
              Welcome back, <span className="gradient-text">{displayName}</span> 👋
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Here&apos;s what&apos;s happening with your {displayRole === "recruiter" ? "recruitment" : "job search"} today
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md ml-auto md:ml-0">
            <motion.div
              animate={{
                boxShadow: searchFocused
                  ? "0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates, jobs, reports..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl
                  focus:outline-none focus:bg-white focus:border-blue-300 transition-all duration-200
                  placeholder:text-slate-400"
              />
              <kbd className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded-md">
                ⌘K
              </kbd>
            </motion.div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 ml-4">
          {/* AI Pulse */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-medium text-blue-600">AI Active</span>
          </motion.div>



          {/* Profile */}
          <div className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-slate-50">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/20">
              {getInitials(displayName)}
            </div>
            <div className="hidden sm:block text-left pr-2">
              <p className="text-sm font-semibold text-slate-700 leading-none">{displayName}</p>
              <p className="text-[11px] text-slate-400 capitalize mt-0.5">{displayRole}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
