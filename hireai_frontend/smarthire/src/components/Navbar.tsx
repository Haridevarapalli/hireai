"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  Sparkles,
  User,
  Settings,
  Briefcase,
  LogOut,
  ChevronDown,
  CheckCircle2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getUserSession, logout } from "@/actions/authActions";
import { getNotifications } from "@/actions/candidateActions";

interface NavbarProps {
  userName: string;
  userRole: string;
  avatarInitials: string;
}

export default function Navbar({ userName, userRole, avatarInitials }: NavbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayName, setDisplayName] = useState(userName);
  const [displayRole, setDisplayRole] = useState(userRole);
  const [userEmail, setUserEmail] = useState("");
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    getUserSession().then((session) => {
      if (session) {
        setDisplayName(session.name);
        setDisplayRole(session.role);
        setUserEmail(session.email);
      }
    });

    getNotifications().then((notifs) => {
      if (Array.isArray(notifs)) {
        const unread = notifs.filter((n: any) => !n.read).length;
        setUnreadNotifsCount(unread);
      }
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const target = displayRole === "recruiter" ? "/recruiter/jobs" : "/candidate/jobs";
    router.push(`${target}?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="flex items-center justify-between h-16 px-3 sm:px-6 lg:px-8">
        {/* Mobile Spacing for Hamburger Menu */}
        <div className="lg:hidden w-10 flex-shrink-0" />

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
          <form onSubmit={handleSearch} className="flex-1 max-w-md ml-auto md:ml-0">
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs by title, company, skills..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full h-10 pl-10 pr-12 text-sm bg-slate-50 border border-slate-200 rounded-xl
                  focus:outline-none focus:bg-white focus:border-blue-300 transition-all duration-200
                  placeholder:text-slate-400"
              />
              <kbd className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded-md">
                ↵ Enter
              </kbd>
            </motion.div>
          </form>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3 ml-4">
          {/* AI Pulse */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-medium text-blue-600">AI Active</span>
          </motion.div>

          {/* Notifications Bell */}
          <button
            onClick={() => router.push(displayRole === "recruiter" ? "/recruiter/notifications" : "/candidate/notifications")}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadNotifsCount > 9 ? "9+" : unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Profile Menu Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/20">
                {getInitials(displayName)}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <p className="text-xs font-bold text-slate-700 leading-none">{displayName}</p>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5">{displayRole}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-800">{displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="text-[10px] text-green-600 font-semibold uppercase tracking-wider">Django Synced</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { setProfileMenuOpen(false); router.push("/candidate/profile"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-blue-500" />
                      My Profile
                    </button>
                    <button
                      onClick={() => { setProfileMenuOpen(false); router.push("/candidate/applied"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <Briefcase className="w-4 h-4 text-purple-500" />
                      Applied Jobs & Tracker
                    </button>
                    <button
                      onClick={() => { setProfileMenuOpen(false); router.push("/candidate/settings"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      Account & Job Settings
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
