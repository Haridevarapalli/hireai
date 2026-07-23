"use client";

import React from "react";
import { Bell, Search, User as UserIcon } from "lucide-react";

interface RecruiterNavbarProps {
  userName: string;
  avatarInitials: string;
}

export default function RecruiterNavbar({ userName, avatarInitials }: RecruiterNavbarProps) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200/60 backdrop-blur-xl">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Mobile Spacing */}
        <div className="lg:hidden w-10"></div>
        
        {/* Search */}
        <div className="flex-1 max-w-xl hidden md:flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidates, jobs, or reports..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder:text-slate-400 text-slate-700"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 md:gap-5 ml-auto">
          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500 border-2 border-white"></span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {/* Profile Dropdown */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-purple-600 transition-colors">
                {userName}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Recruiter
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20 text-white font-bold text-sm">
              {avatarInitials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
