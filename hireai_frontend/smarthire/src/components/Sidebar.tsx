"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Brain,
  Star,
  Video,
  BarChart3,
  FileBarChart,
  Settings,
  LogOut,
  User,
  FileText,
  Search,
  Send,
  Calendar,
  Bell,
  ChevronLeft,
  Sparkles,
  Menu,
  X,
  GitBranch,
  MessageSquare,
  Lightbulb,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Briefcase,
  Users,
  Brain,
  Star,
  Video,
  BarChart3,
  FileBarChart,
  Settings,
  LogOut,
  User,
  FileText,
  Search,
  Send,
  Calendar,
  Bell,
  Sparkles,
  GitBranch,
  MessageSquare,
  Lightbulb,
};

interface NavItem {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
  userType: "recruiter" | "candidate";
}

export default function Sidebar({ navItems, userType }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-7 pb-8">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-lg font-bold text-white tracking-tight">
                Smart<span className="gradient-text">Hire</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                AI Platform
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Label */}
      {!collapsed && (
        <div className="px-5 mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {userType === "recruiter" ? "Recruitment" : "Candidate"}
          </p>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href;

          return (
            <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                  transition-all duration-200 ease-out
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-purple-600/15 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full gradient-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div
                  className={`
                    flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200
                    ${isActive ? "bg-blue-500/20 text-blue-400" : "text-slate-500 group-hover:text-slate-300"}
                  `}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className={`text-sm font-medium overflow-hidden whitespace-nowrap ${
                        isActive ? "text-white" : ""
                      }`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/5 pt-4 mt-4">
        <Link href={`/${userType}/settings`} onClick={() => setMobileOpen(false)}>
          <motion.div
            whileHover={{ x: 4 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg">
              <Settings className="w-[18px] h-[18px]" />
            </div>
            {!collapsed && <span className="text-sm font-medium">Settings</span>}
          </motion.div>
        </Link>
        <button 
          onClick={async () => {
            setMobileOpen(false);
            const { logout } = await import('@/actions/authActions');
            await logout();
          }}
          className="w-full text-left"
        >
          <motion.div
            whileHover={{ x: 4 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg">
              <LogOut className="w-[18px] h-[18px]" />
            </div>
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </motion.div>
        </button>
      </div>


      {/* Collapse Button (Desktop) */}
      <div className="hidden lg:flex px-3 pb-5 justify-center">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </motion.button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-[260px] z-50 gradient-sidebar flex flex-col"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-4 w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-30 gradient-sidebar flex-col shadow-2xl"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
