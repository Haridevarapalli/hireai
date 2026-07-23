"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { candidateNotifications } from "@/lib/data";
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
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Calendar,
  Star,
  Brain,
  FileText,
  MessageSquare,
  Lightbulb,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(candidateNotifications);
  const [filter, setFilter] = useState("All");

  const markAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, unread: false }))
    );
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered =
    filter === "All"
      ? notifications
      : filter === "Unread"
      ? notifications.filter((n) => n.unread)
      : notifications.filter((n) => n.type === filter.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay updated with your job search progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              {unreadCount} unread
            </span>
          )}
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
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
        {["All", "Unread", "Interview", "Shortlist", "Screening", "Update", "Message", "Tip"].map((f) => (
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
        {filtered.map((notif, i) => {
          const Icon = iconMap[notif.icon] || Bell;
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md cursor-pointer ${
                notif.unread
                  ? "border-blue-200 bg-blue-50/20"
                  : "border-slate-100"
              }`}
              style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${notif.color}12` }}
                >
                  <Icon className="w-5 h-5" style={{ color: notif.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-800">
                          {notif.title}
                        </h3>
                        {notif.unread && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">{notif.time}</p>
                    </div>
                    <button className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-sm text-slate-500">No notifications found</p>
        </div>
      )}
    </div>
  );
}
