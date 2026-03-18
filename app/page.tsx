"use client";

import {
  Users,
  UserPlus,
  UserMinus,
  CheckCircle,
  Activity,
  ArrowUpRight,
  Laptop,
  Package,
  Shield,
  Bell,
  Search,
  AlertCircle,
  TrendingUp,
  Clock,
  ChevronRight,
  Settings
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function Dashboard() {
  const [assetStats, setAssetStats] = useState({
    total: 8412,
    available: 427,
    allocated: 7985,
    compliance: 91,
    healthy: 95,
    onboarding: 124,
    loading: false,
  });

  // Simulated real-time updates for that "live" feel
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-6 lg:p-10 space-y-10 min-h-screen pb-20"
    >
      {/* Premium Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
            IT Asset & Endpoint Management
          </h1>
          <p className="text-muted-foreground mt-1 text-base">Centralized control center for your entire IT fleet.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Global Search..." 
              className="bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-xl py-2 pl-10 pr-4 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button className="p-2.5 rounded-xl glass-card relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-background animate-pulse" />
          </button>
          <div className="flex items-center gap-3 glass-pill py-1.5 pl-1.5 pr-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 overflow-hidden border border-white/20">
              <img src="https://ui-avatars.com/api/?name=Admin+User&background=6366f1&color=fff" alt="Avatar" />
            </div>
            <span className="text-xs font-semibold">Admin</span>
          </div>
        </div>
      </motion.div>

      {/* Hero Stats */}
      <motion.div variants={item} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Managed Assets", value: assetStats.total.toLocaleString(), delta: "+14%", icon: Package, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Healthy Endpoints", value: `${assetStats.healthy}%`, delta: "95% uptime", icon: Shield, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Software Compliance", value: `${assetStats.compliance}%`, delta: "Target: 95%", icon: CheckCircle, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Onboarding Today", value: assetStats.onboarding, delta: "Active runs", icon: Activity, color: "text-sky-500", bg: "bg-sky-500/10" },
        ].map((stat, i) => (
          <div key={stat.label} className="glass-card p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className={cn("w-20 h-20", stat.color)} />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
              <div className={cn("p-2 rounded-xl", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="text-4xl font-black text-foreground">{stat.value}</div>
              <span className={cn("text-xs font-bold mb-1.5", i === 0 ? "text-emerald-500" : "text-muted-foreground")}>
                {stat.delta}
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Detailed Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        
        {/* Device Health Chart Placeholder */}
        <motion.div variants={item} className="lg:col-span-3 glass-panel p-8 rounded-[2rem] flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-bold">Device Health Overview</h3>
              <p className="text-xs text-muted-foreground">Status of managed endpoints</p>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground/50" />
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center relative">
            {/* Custom SVG Radial Gauge */}
            <div className="relative w-48 h-48">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-slate-100 dark:text-slate-800" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                <circle className="text-emerald-500" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.95)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" transform="rotate(-90 50 50)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black">95%</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Healthy</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-8 mt-12 w-full">
              {[
                { label: "Healthy", count: "7,985", color: "bg-emerald-500" },
                { label: "Warning", count: "258", color: "bg-amber-500" },
                { label: "Critical", count: "169", color: "bg-rose-500" },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center">
                   <div className="flex items-center gap-1.5 mb-1">
                     <div className={cn("w-1.5 h-1.5 rounded-full", s.color)} />
                     <span className="text-[10px] font-bold text-muted-foreground uppercase">{s.label}</span>
                   </div>
                   <span className="text-sm font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Software Compliance & Trends */}
        <motion.div variants={item} className="lg:col-span-4 glass-panel p-8 rounded-[2rem]">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-bold">Endpoint Status Trends</h3>
              <p className="text-xs text-muted-foreground">Fleet activity over the last 7 days</p>
            </div>
            <div className="flex gap-2">
              {['Live', 'Offline', 'Patching'].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 glass-pill">
                   <div className={cn("w-1.5 h-1.5 rounded-full", t === 'Live' ? 'bg-indigo-500' : t === 'Offline' ? 'bg-slate-400' : 'bg-rose-400')} />
                   {t}
                </div>
              ))}
            </div>
          </div>
          
          <div className="h-64 flex items-end gap-3 mt-8">
            {[45, 67, 43, 89, 75, 54, 82].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3">
                <div className="w-full relative group">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${v}%` }}
                    transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                    className="w-full bg-gradient-to-t from-indigo-600/20 to-indigo-500 rounded-t-xl group-hover:brightness-110 transition-all cursor-pointer relative"
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded-md transition-opacity whitespace-nowrap z-10">
                      {v}% Active
                    </div>
                  </motion.div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Day {i+1}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 p-5 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 flex items-center justify-between">
            <div className="flex gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-bold">Fleet performance is up 12%</p>
                <p className="text-xs text-muted-foreground">Driven by recent macOS Sonoma updates.</p>
              </div>
            </div>
            <button className="text-xs font-bold text-primary hover:underline">View Detailed Report</button>
          </div>
        </motion.div>

        {/* Onboarding Funnel */}
        <motion.div variants={item} className="lg:col-span-3 glass-panel p-8 rounded-[2rem]">
          <h3 className="text-xl font-bold mb-8">Employee Onboarding</h3>
          <div className="space-y-6">
            {[
              { label: "Hired", count: 215, color: "bg-indigo-500", percent: 100 },
              { label: "Asset Prep", count: 134, color: "bg-sky-500", percent: 62 },
              { label: "Provisioned", count: 78, color: "bg-purple-500", percent: 36 },
              { label: "Ready", count: 31, color: "bg-emerald-500", percent: 14 },
            ].map((f, i) => (
              <div key={f.label} className="relative group">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-foreground/80 lowercase">{f.label}</span>
                  <span className="text-sm font-black">{f.count}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${f.percent}%` }}
                    transition={{ delay: 0.8 + (i * 0.1), duration: 0.8 }}
                    className={cn("h-full rounded-full shadow-lg h-full", f.color)} 
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10">
             <Link href="/onboarding" className="w-full flex items-center justify-center gap-2 py-3 glass-card rounded-xl text-sm font-bold hover:bg-slate-100 transform transition-all">
                <UserPlus className="h-4 w-4" />
                Manage Onboarding Queue
             </Link>
          </div>
        </motion.div>

        {/* Recent Critical Alerts */}
        <motion.div variants={item} className="lg:col-span-4 glass-panel p-8 rounded-[2rem]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold">Recent Critical Alerts</h3>
            <button className="text-xs font-bold glass-pill hover:bg-white/50 transition-colors">View All Logs</button>
          </div>
          <div className="space-y-4">
            {[
              { device: "PC-DESK-401", user: "John Doe", type: "Malware Detected", status: "Unresolved", severity: "Critical", time: "2m ago" },
              { device: "LT-PRO-012", user: "Sarah Chen", type: "Compliance Failed", status: "In Progress", severity: "Medium", time: "15m ago" },
              { device: "LT-PRO-012", user: "Sarah Chen", type: "OS Update Pending", status: "Scheduled", severity: "Low", time: "1h ago" },
            ].map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-white/40 dark:hover:bg-white/5 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-white/10">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    alert.severity === 'Critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                  )}>
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-sm tracking-tight">{alert.device}</span>
                       <span className="text-[10px] font-black uppercase text-muted-foreground/50">/ {alert.user}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">{alert.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full mb-1",
                      alert.status === 'Unresolved' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                      alert.status === 'In Progress' ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' : 
                      'bg-slate-100 text-slate-600 dark:bg-slate-800'
                    )}>
                      {alert.status}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground italic flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {alert.time}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Quick Launchpad Footer */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
         {[
           { label: "JAMF Portal", icon: Laptop },
           { label: "Scalefusion", icon: Shield },
           { label: "Okta Admin", icon: Users },
           { label: "Slack Console", icon: Activity },
           { label: "Snipe-IT", icon: Package },
           { label: "System Config", icon: Settings },
         ].map(target => (
            <button key={target.label} className="glass-card p-4 rounded-3xl flex flex-col items-center gap-3 group">
               <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/10 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-sm">
                 <target.icon className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{target.label}</span>
            </button>
         ))}
      </motion.div>
    </motion.div>
  );
}
