"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  Settings,
  LogOut,
  ChevronDown,
  Building,
  CheckCircle2,
  Brain,
  Star,
  Calendar,
  Award,
  XCircle,
  FileText,
  Check,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getUserSession, logout } from "@/actions/authActions";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  NotificationItem
} from "@/actions/notificationActions";

interface RecruiterNavbarProps {
  userName: string;
  avatarInitials: string;
}

function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      if (date.getDate() === now.getDate()) return "Today";
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

function getNotificationIcon(type: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("ai") || t.includes("screen")) return <Brain className="w-4 h-4 text-purple-500" />;
  if (t.includes("shortlist")) return <Star className="w-4 h-4 text-amber-500" />;
  if (t.includes("interview")) return <Calendar className="w-4 h-4 text-indigo-500" />;
  if (t.includes("offer") || t.includes("hire")) return <Award className="w-4 h-4 text-emerald-500" />;
  if (t.includes("reject")) return <XCircle className="w-4 h-4 text-rose-500" />;
  return <FileText className="w-4 h-4 text-blue-500" />;
}

function getNotificationRoute(notif: NotificationItem): string {
  if (notif.payload?.route) return notif.payload.route;
  const t = (notif.type || "").toLowerCase();
  if (t.includes("ai") || t.includes("screen")) return "/recruiter/ai-screening";
  if (t.includes("shortlist")) return "/recruiter/shortlisted";
  if (t.includes("interview")) return "/recruiter/interviews";
  if (t.includes("offer") || t.includes("hire")) return "/recruiter/applicants";
  return "/recruiter/applicants";
}

export default function RecruiterNavbar({ userName, avatarInitials }: RecruiterNavbarProps) {
  const [displayName, setDisplayName] = useState(userName);
  const [userEmail, setUserEmail] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifs = async () => {
    try {
      const data = await getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    getUserSession().then((session) => {
      if (session) {
        if (session.name) setDisplayName(session.name);
        if (session.email) setUserEmail(session.email);
      }
    });

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getInitials = (name: string) => {
    if (!name) return avatarInitials || "RE";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/recruiter/applicants?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      await markNotificationRead(notif.id);
    }
    setNotifsOpen(false);
    const targetRoute = getNotificationRoute(notif);
    router.push(targetRoute);
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsRead();
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 border-b border-slate-200/60 backdrop-blur-xl">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile Spacing */}
        <div className="lg:hidden w-10"></div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidates, jobs, or reports..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder:text-slate-400 text-slate-700"
            />
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-3 md:gap-4 ml-auto">
          {/* Notifications Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifsOpen(!notifsOpen);
                if (profileMenuOpen) setProfileMenuOpen(false);
              }}
              className={`relative p-2 rounded-xl transition-all duration-200 ${
                notifsOpen
                  ? "text-purple-600 bg-purple-50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
              title="Notifications"
              aria-label="Open notifications"
              aria-expanded={notifsOpen}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse-soft">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifsOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-0 z-50 overflow-hidden"
                  style={{ boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)" }}
                >
                  {/* Header */}
                  <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                      {unreadCount > 0 ? (
                        <span className="px-2 py-0.5 text-[11px] font-bold text-purple-700 bg-purple-100 rounded-full border border-purple-200">
                          {unreadCount} new
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 rounded-full">
                          All caught up
                        </span>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center px-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                          <Bell className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">No new notifications</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          You&apos;ll be notified when candidates apply, get shortlisted, or interview.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors text-left group ${
                            !notif.read
                              ? "bg-purple-50/40 hover:bg-purple-50/80"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                            !notif.read
                              ? "bg-white border-purple-200 shadow-sm"
                              : "bg-slate-100 border-slate-200"
                          }`}>
                            {getNotificationIcon(notif.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs truncate ${!notif.read ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'}`}>
                                {notif.title}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap flex-shrink-0">
                                {formatTimeAgo(notif.created_at)}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                              {notif.body}
                            </p>
                          </div>

                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-purple-600 flex-shrink-0 mt-1.5 shadow-sm" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        Showing recent {notifications.length} notifications
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[11px] font-semibold text-purple-600 hover:text-purple-700"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setProfileMenuOpen(!profileMenuOpen);
                if (notifsOpen) setNotifsOpen(false);
              }}
              className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-all duration-200 text-left group"
              aria-expanded={profileMenuOpen}
              aria-label="Recruiter Profile Menu"
            >
              <div className="hidden sm:block text-right pr-1">
                <p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-purple-600 transition-colors">
                  {displayName}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Recruiter
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20 text-white font-bold text-sm select-none">
                {getInitials(displayName)}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${profileMenuOpen ? 'rotate-180 text-purple-600' : ''}`} />
            </button>

            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden"
                  style={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
                >
                  {/* User Profile Header */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-800">{displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{userEmail || "recruiter@smarthire.ai"}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Recruiter Account</span>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        router.push("/recruiter/settings");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors text-left"
                    >
                      <Building className="w-4 h-4 text-purple-500" />
                      My Profile
                    </button>

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        router.push("/recruiter/settings");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      Settings
                    </button>
                  </div>

                  {/* Logout Action */}
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Logout
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
