"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Calendar,
  Star,
  Brain,
  FileText,
  MessageSquare,
  Lightbulb,
  Check,
  Trash2,
  Filter,
  Briefcase,
  Award
} from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} from "@/actions/candidateActions";

function getIconAndColor(type: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("interview")) return { icon: Calendar, color: "#3B82F6" };
  if (t.includes("shortlist")) return { icon: Star, color: "#10B981" };
  if (t.includes("offer")) return { icon: Award, color: "#8B5CF6" };
  if (t.includes("application")) return { icon: Briefcase, color: "#F59E0B" };
  if (t.includes("reject")) return { icon: FileText, color: "#EF4444" };
  return { icon: Bell, color: "#6366F1" };
}

function formatRelativeTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "Recently";
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const loadNotifs = async () => {
    setLoading(true);
    const data = await getNotifications();
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered =
    filter === "All"
      ? notifications
      : filter === "Unread"
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => (n.type || "").toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time updates on your applications, interviews, and recruiter reviews
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              {unreadCount} unread
            </span>
          )}
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </button>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 flex-wrap"
      >
        {["All", "Unread", "Interview", "Shortlist", "Application", "Offer", "Reject"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f}
          </button>
        ))}
      </motion.div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : (
          filtered.map((notif, i) => {
            const { icon: Icon, color } = getIconAndColor(notif.type);
            const isUnread = !notif.read;

            return (
              <motion.div
                key={notif.id}
                onClick={() => isUnread && handleMarkRead(notif.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md cursor-pointer ${
                  isUnread
                    ? "border-blue-200 bg-blue-50/20"
                    : "border-slate-100"
                }`}
                style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-800">
                            {notif.title}
                          </h3>
                          {isUnread && (
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                          {notif.body}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          {formatRelativeTime(notif.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, notif.id)}
                        title="Delete notification"
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No notifications found</p>
          <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
        </div>
      )}
    </div>
  );
}
