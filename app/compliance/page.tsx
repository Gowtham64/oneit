"use client";

import { motion } from "framer-motion";
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, Lock,
  HardDrive, Wifi, RefreshCw, ChevronRight, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1 } };

const policies = [
  {
    name: "Disk Encryption",
    icon: HardDrive,
    description: "FileVault / BitLocker must be enabled",
    compliant: 118,
    total: 124,
    severity: "critical",
    nonCompliantDevices: ["Alex Kim – Dell ThinkPad X1", "John Doe – Dell XPS 15"],
  },
  {
    name: "OS Up to Date",
    icon: RefreshCw,
    description: "Latest security patches applied",
    compliant: 102,
    total: 124,
    severity: "high",
    nonCompliantDevices: ["Raj Patel – MacBook Pro 14\"", "John Doe – Dell XPS 15", "Alex Kim – Dell ThinkPad X1"],
  },
  {
    name: "Screen Lock Enabled",
    icon: Lock,
    description: "Auto-lock within 5 minutes",
    compliant: 121,
    total: 124,
    severity: "medium",
    nonCompliantDevices: ["John Doe – Dell XPS 15"],
  },
  {
    name: "MDM Enrolled",
    icon: Shield,
    description: "Device must be enrolled in JAMF or Scalefusion",
    compliant: 124,
    total: 124,
    severity: "critical",
    nonCompliantDevices: [],
  },
  {
    name: "Antivirus Active",
    icon: CheckCircle2,
    description: "CrowdStrike or Defender must be running",
    compliant: 119,
    total: 124,
    severity: "high",
    nonCompliantDevices: ["Alex Kim – Dell ThinkPad X1", "Sarah Connor – HP EliteBook", "Tom Brady – MacBook Air"],
  },
  {
    name: "VPN Configured",
    icon: Wifi,
    description: "Corporate VPN profile installed",
    compliant: 110,
    total: 124,
    severity: "medium",
    nonCompliantDevices: ["Multiple (14 devices)"],
  },
];

const severityBadge: Record<string, string> = {
  critical: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  high: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  medium: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
};

export default function CompliancePage() {
  const overallCompliant = policies.every(p => p.compliant === p.total);
  const overallPct = Math.round(
    (policies.reduce((a, p) => a + p.compliant, 0) / policies.reduce((a, p) => a + p.total, 0)) * 100
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 lg:p-10 space-y-8 pb-20">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
            Compliance Monitoring
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Security policy enforcement across all managed endpoints</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 glass-card px-4 py-2 rounded-xl text-sm font-semibold">
            <RefreshCw className="w-4 h-4" /> Re-scan Policies
          </button>
        </div>
      </motion.div>

      {/* Overall Score */}
      <motion.div variants={item} className="glass-panel p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-10">
        <div className="relative shrink-0 w-44 h-44">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle strokeWidth="8" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" className="text-slate-100 dark:text-slate-800" />
            <circle
              strokeWidth="8"
              strokeDasharray="263.9"
              strokeDashoffset={263.9 * (1 - overallPct / 100)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
              className={overallPct >= 90 ? "text-emerald-500" : overallPct >= 75 ? "text-amber-500" : "text-rose-500"}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black">{overallPct}%</span>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Compliant</span>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-2xl font-black">Overall Fleet Compliance</h2>
            <p className="text-muted-foreground text-sm mt-1">Based on {policies.length} active security policies across 124 enrolled devices</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Policies Passing", value: policies.filter(p => p.compliant === p.total).length, color: "text-emerald-500" },
              { label: "Policies Failing", value: policies.filter(p => p.compliant < p.total).length, color: "text-rose-500" },
              { label: "Devices at Risk", value: "6", color: "text-amber-500" },
            ].map(s => (
              <div key={s.label} className="glass-card p-4 rounded-2xl">
                <div className={cn("text-3xl font-black", s.color)}>{s.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Policy Cards */}
      <motion.div variants={item} className="grid md:grid-cols-2 gap-5">
        {policies.map((policy, i) => {
          const pct = Math.round((policy.compliant / policy.total) * 100);
          const passing = policy.compliant === policy.total;
          return (
            <motion.div
              key={policy.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="glass-card p-6 rounded-[1.5rem] group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", passing ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                    <policy.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{policy.name}</div>
                    <div className="text-xs text-muted-foreground">{policy.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-lg uppercase", severityBadge[policy.severity])}>
                    {policy.severity}
                  </span>
                  {passing ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                </div>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>{policy.compliant} / {policy.total} devices compliant</span>
                <span className={cn("font-black", passing ? "text-emerald-500" : "text-rose-500")}>{pct}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.5 + (i * 0.08), duration: 0.9 }}
                  className={cn("h-full rounded-full", passing ? "bg-emerald-500" : pct >= 75 ? "bg-amber-500" : "bg-rose-500")}
                />
              </div>

              {policy.nonCompliantDevices.length > 0 && (
                <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">Non-Compliant Devices</span>
                  </div>
                  {policy.nonCompliantDevices.map((d, idx) => (
                    <div key={idx} className="text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1 mt-1">
                      <ChevronRight className="w-3 h-3 shrink-0" /> {d}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
