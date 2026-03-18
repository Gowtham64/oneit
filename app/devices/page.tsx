"use client";

import { motion } from "framer-motion";
import {
  Laptop, Shield, Wifi, WifiOff, AlertCircle, CheckCircle2,
  Search, Filter, RefreshCw, Download, ChevronDown, Apple, Monitor
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1 } };

const devices = [
  { id: "JAMF-001", name: "MacBook Pro 16\"", user: "Sarah Chen", os: "macOS Sonoma 14.4", serial: "C02ZG5XVMD6N", mdm: "JAMF", status: "Healthy", compliance: "Compliant", lastSeen: "2m ago", type: "mac" },
  { id: "SF-002", name: "Dell XPS 15", user: "John Doe", os: "Windows 11 23H2", serial: "5CG2340PL9", mdm: "Scalefusion", status: "Warning", compliance: "Non-Compliant", lastSeen: "1h ago", type: "win" },
  { id: "JAMF-003", name: "MacBook Air M2", user: "Priya Sharma", os: "macOS Sonoma 14.4", serial: "FVFD3H5XHVGJ", mdm: "JAMF", status: "Healthy", compliance: "Compliant", lastSeen: "5m ago", type: "mac" },
  { id: "SF-004", name: "Lenovo ThinkPad X1", user: "Alex Kim", os: "Windows 11 22H2", serial: "PC1B4M3K", mdm: "Scalefusion", status: "Critical", compliance: "Non-Compliant", lastSeen: "3d ago", type: "win" },
  { id: "JAMF-005", name: "MacBook Pro 14\"", user: "Raj Patel", os: "macOS Ventura 13.6", serial: "C02ZX9XHMD6T", mdm: "JAMF", status: "Warning", compliance: "Compliant", lastSeen: "30m ago", type: "mac" },
  { id: "SF-006", name: "HP EliteBook 840", user: "Emma Wilson", os: "Windows 11 23H2", serial: "5CG5120VTK", mdm: "Scalefusion", status: "Healthy", compliance: "Compliant", lastSeen: "10m ago", type: "win" },
  { id: "JAMF-007", name: "MacBook Air M3", user: "David Lee", os: "macOS Sonoma 14.4", serial: "FVFG8M4XHVGM", mdm: "JAMF", status: "Healthy", compliance: "Compliant", lastSeen: "Just now", type: "mac" },
  { id: "SF-008", name: "Dell Latitude 5540", user: "Aisha Nwosu", os: "Windows 11 23H2", serial: "7CG2990JL1", mdm: "Scalefusion", status: "Healthy", compliance: "Compliant", lastSeen: "8m ago", type: "win" },
];

const statusColors: Record<string, string> = {
  Healthy: "text-emerald-500 bg-emerald-500/10",
  Warning: "text-amber-500 bg-amber-500/10",
  Critical: "text-rose-500 bg-rose-500/10",
};

const complianceColors: Record<string, string> = {
  Compliant: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Non-Compliant": "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400",
};

export default function DevicesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "JAMF" | "Scalefusion">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Healthy" | "Warning" | "Critical">("All");

  const filtered = devices.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.user.toLowerCase().includes(search.toLowerCase()) ||
      d.serial.toLowerCase().includes(search.toLowerCase());
    const matchMdm = filter === "All" || d.mdm === filter;
    const matchStatus = statusFilter === "All" || d.status === statusFilter;
    return matchSearch && matchMdm && matchStatus;
  });

  const stats = {
    total: devices.length,
    jamf: devices.filter(d => d.mdm === "JAMF").length,
    scalefusion: devices.filter(d => d.mdm === "Scalefusion").length,
    healthy: devices.filter(d => d.status === "Healthy").length,
    critical: devices.filter(d => d.status === "Critical").length,
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 lg:p-10 space-y-8 pb-20">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
            Device Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Unified MDM fleet view — JAMF &amp; Scalefusion</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 glass-card px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/60 transition-all">
            <RefreshCw className="w-4 h-4" /> Sync MDM
          </button>
          <button className="flex items-center gap-2 glass-card px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/60 transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Devices", value: stats.total, icon: Laptop, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "JAMF (Mac)", value: stats.jamf, icon: Apple, color: "text-slate-600 dark:text-slate-300", bg: "bg-slate-500/10" },
          { label: "Scalefusion (Win)", value: stats.scalefusion, icon: Monitor, color: "text-sky-500", bg: "bg-sky-500/10" },
          { label: "Healthy", value: stats.healthy, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Critical", value: stats.critical, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 rounded-2xl flex flex-col gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", s.bg)}>
              <s.icon className={cn("w-5 h-5", s.color)} />
            </div>
            <div>
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by device, user, or serial..."
            className="w-full bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(["All", "JAMF", "Scalefusion"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all", filter === f ? "bg-indigo-600 text-white shadow-lg" : "glass-card")}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["All", "Healthy", "Warning", "Critical"] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all", statusFilter === f ? "bg-indigo-600 text-white shadow-lg" : "glass-card")}>
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Device Table */}
      <motion.div variants={item} className="glass-panel rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 dark:border-white/5">
                {["Device", "User", "OS Version", "MDM", "Status", "Compliance", "Last Seen"].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-white/5 hover:bg-white/30 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", d.type === "mac" ? "bg-slate-500/10" : "bg-sky-500/10")}>
                        {d.type === "mac" ? <Apple className="w-4 h-4 text-slate-600 dark:text-slate-300" /> : <Monitor className="w-4 h-4 text-sky-500" />}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{d.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground/60">{d.serial}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground/80">{d.user}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground font-mono">{d.os}</td>
                  <td className="px-6 py-4">
                    <span className={cn("text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider", d.mdm === "JAMF" ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400")}>
                      {d.mdm}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn("flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl w-fit", statusColors[d.status])}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", d.status === "Healthy" ? "bg-emerald-500 animate-pulse" : d.status === "Warning" ? "bg-amber-500" : "bg-rose-500")} />
                      {d.status}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("text-[10px] font-black px-2 py-1 rounded-lg", complianceColors[d.compliance])}>
                      {d.compliance}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">{d.lastSeen}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Laptop className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold">No devices found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
