"use client";

import { motion } from "framer-motion";
import {
  Activity, UserPlus, UserMinus, Shield, Settings, Key,
  Laptop, AlertCircle, CheckCircle2, Search, Download, Filter, Clock
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1 } };

const allLogs = [
  { id: 1, action: "Employee Onboarded", actor: "System (HRMS Webhook)", target: "Priya Sharma", category: "onboarding", severity: "info", ts: "2026-03-18 16:58:02", detail: "Google, Slack, Okta, M365 accounts created. MacBook Air M2 assigned." },
  { id: 2, action: "Policy Violation Detected", actor: "JAMF MDM", target: "MacBook Pro 14\" – Raj Patel", category: "compliance", severity: "warning", ts: "2026-03-18 16:45:11", detail: "OS version out of date. macOS Ventura 13.6 detected, minimum 14.0 required." },
  { id: 3, action: "Malware Alert", actor: "Scalefusion MDM", target: "Dell XPS 15 – John Doe", category: "security", severity: "critical", ts: "2026-03-18 16:30:44", detail: "CrowdStrike detected Trojan.GenericKD.47852622. Device quarantined." },
  { id: 4, action: "Asset Deallocated", actor: "IT Admin (Gowtham)", target: "Dell XPS 13 – Former Employee", category: "asset", severity: "info", ts: "2026-03-18 15:10:00", detail: "Device returned. Snipe-IT asset status set to 'Available'." },
  { id: 5, action: "MFA Enforced", actor: "Okta Automation", target: "Alex Kim", category: "security", severity: "info", ts: "2026-03-18 14:55:22", detail: "MFA policy applied. User enrolled in TOTP authenticator." },
  { id: 6, action: "Google Workspace OU Changed", actor: "IT Admin (Gowtham)", target: "Emma Wilson", category: "provisioning", severity: "info", ts: "2026-03-18 13:40:08", detail: "User moved from /Contractors to /Full-Time/Engineering." },
  { id: 7, action: "Employee Offboarded", actor: "System (HRMS Webhook)", target: "Former Employee — ID 2041", category: "offboarding", severity: "info", ts: "2026-03-18 12:00:00", detail: "All accounts suspended. Jira asset-collection ticket created (#IT-5521)." },
  { id: 8, action: "Disk Encryption Enabled", actor: "JAMF MDM", target: "MacBook Air M3 – David Lee", category: "compliance", severity: "info", ts: "2026-03-18 11:22:51", detail: "FileVault enabled via MDM policy. Recovery key escrowed." },
  { id: 9, action: "Slack Channel Granted", actor: "IT Admin (Gowtham)", target: "Aisha Nwosu", category: "provisioning", severity: "info", ts: "2026-03-18 10:15:44", detail: "Added to #engineering-team and #all-hands as full member." },
  { id: 10, action: "Integration Health Check Failed", actor: "System Monitor", target: "Snipe-IT API", category: "system", severity: "warning", ts: "2026-03-18 08:05:00", detail: "Snipe-IT API responded with HTTP 503. Retry succeeded after 2 minutes." },
  { id: 11, action: "Security Policy Updated", actor: "IT Admin (Gowtham)", target: "Global MFA Policy", category: "security", severity: "info", ts: "2026-03-17 17:30:00", detail: "Session timeout updated from 8h to 4h. Effective immediately." },
  { id: 12, action: "Asset Allocated", actor: "System (Onboarding Workflow)", target: "Priya Sharma", category: "asset", severity: "info", ts: "2026-03-17 09:12:35", detail: "MacBook Air M2 (FVFD3H5XHVGJ) allocated. JAMF enrollment triggered." },
];

const categories = ["All", "onboarding", "offboarding", "security", "compliance", "asset", "provisioning", "system"] as const;

const categoryStyles: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  onboarding: { icon: UserPlus, color: "text-violet-500", bg: "bg-violet-500/10" },
  offboarding: { icon: UserMinus, color: "text-pink-500", bg: "bg-pink-500/10" },
  security: { icon: Shield, color: "text-rose-500", bg: "bg-rose-500/10" },
  compliance: { icon: CheckCircle2, color: "text-amber-500", bg: "bg-amber-500/10" },
  asset: { icon: Laptop, color: "text-sky-500", bg: "bg-sky-500/10" },
  provisioning: { icon: Key, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  system: { icon: Settings, color: "text-slate-500", bg: "bg-slate-500/10" },
};

const severityDot: Record<string, string> = {
  info: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-rose-500",
};

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<typeof categories[number]>("All");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = allLogs.filter(l => {
    const matchSearch = l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || l.category === category;
    return matchSearch && matchCat;
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 lg:p-10 space-y-8 pb-20">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Complete, tamper-proof trail of all IT operations and system events</p>
        </div>
        <button className="flex items-center gap-2 glass-card px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/60 transition-all self-start md:self-auto">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Events (24h)", value: allLogs.length, icon: Activity, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Critical Alerts", value: allLogs.filter(l => l.severity === "critical").length, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
          { label: "Warnings", value: allLogs.filter(l => l.severity === "warning").length, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Automated Actions", value: allLogs.filter(l => l.actor.includes("System")).length, icon: Settings, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 rounded-2xl flex flex-col gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", s.bg)}>
              <s.icon className={cn("w-5 h-5", s.color)} />
            </div>
            <div>
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search actions, actors, or targets..."
            className="w-full bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize", category === c ? "bg-indigo-600 text-white shadow-lg" : "glass-card")}>
              {c}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Log Timeline */}
      <motion.div variants={item} className="space-y-3">
        {filtered.map((log, i) => {
          const style = categoryStyles[log.category] || categoryStyles.system;
          const Icon = style.icon;
          const isExpanded = expanded === log.id;

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => setExpanded(isExpanded ? null : log.id)}
            >
              <div className="flex items-center gap-4 p-4">
                {/* Severity dot */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={cn("w-2.5 h-2.5 rounded-full", severityDot[log.severity], log.severity === "critical" ? "animate-pulse" : "")} />
                </div>

                {/* Icon */}
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", style.bg)}>
                  <Icon className={cn("w-4 h-4", style.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-sm">{log.action}</span>
                    <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-lg uppercase", 
                      log.severity === "critical" ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" :
                      log.severity === "warning" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    )}>{log.severity}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    <span className="font-semibold">{log.actor}</span> → <span>{log.target}</span>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {log.ts.split(" ")[1]}
                  </div>
                  <div className="text-[10px] text-muted-foreground/50 mt-0.5">{log.ts.split(" ")[0]}</div>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="px-5 pb-4 border-t border-white/10 dark:border-white/5"
                >
                  <p className="text-xs text-muted-foreground pt-3 leading-relaxed bg-white/30 dark:bg-white/5 px-4 py-3 rounded-xl border border-white/10 mt-2">
                    {log.detail}
                  </p>
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 glass-panel rounded-[2rem] text-muted-foreground">
            <Activity className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold">No logs found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
