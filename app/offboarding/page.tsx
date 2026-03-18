"use client";

import { useState } from "react";
import {
  Loader2, CheckCircle, AlertCircle, UserX, Upload,
  FileText, Download, Users, User, Shield, MessageSquare,
  Chrome, Mail, Package, Laptop, AlertTriangle, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";

type OffboardEmployee = { email: string; userId?: string; reason?: string; };

type OffboardStep = {
  id: string; label: string; icon: React.ElementType;
  status: "pending" | "running" | "success" | "error"; message?: string;
};

const DEFAULT_STEPS: OffboardStep[] = [
  { id: "google", label: "Google Workspace", icon: Chrome, status: "pending" },
  { id: "okta", label: "Okta Identity", icon: Shield, status: "pending" },
  { id: "m365", label: "Microsoft 365", icon: Mail, status: "pending" },
  { id: "slack", label: "Slack Access", icon: MessageSquare, status: "pending" },
  { id: "snipeit", label: "Snipe-IT Asset Return", icon: Package, status: "pending" },
  { id: "mdm", label: "MDM Device Wipe", icon: Laptop, status: "pending" },
];

function OffboardChecklist({ steps }: { steps: OffboardStep[] }) {
  return (
    <div className="glass-panel p-6 rounded-3xl space-y-3">
      <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Revocation Status</h3>
      {steps.map((step) => (
        <div key={step.id} className="flex items-center gap-3 py-2">
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all",
            step.status === "success" ? "bg-emerald-500/10" :
            step.status === "error" ? "bg-rose-500/10" :
            step.status === "running" ? "bg-red-500/10" : "bg-slate-100 dark:bg-slate-800"
          )}>
            {step.status === "running" ? <Loader2 className="w-4 h-4 text-red-500 animate-spin" /> :
             step.status === "success" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
             step.status === "error" ? <X className="w-4 h-4 text-rose-500" /> :
             <step.icon className="w-4 h-4 text-muted-foreground/50" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{step.label}</div>
            {step.message && <p className="text-xs text-muted-foreground mt-0.5 truncate">{step.message}</p>}
          </div>
          <div className={cn(
            "text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ml-2 shrink-0",
            step.status === "success" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
            step.status === "error" ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" :
            step.status === "running" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
            "text-muted-foreground/50"
          )}>
            {step.status === "pending" ? "Queued" : step.status}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OffboardingPage() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [steps, setSteps] = useState<OffboardStep[]>(DEFAULT_STEPS);
  const [csvData, setCsvData] = useState<OffboardEmployee[]>([]);
  const [processingIndex, setProcessingIndex] = useState(-1);
  const [results, setResults] = useState({ success: 0, failed: 0 });

  function updateStep(id: string, updates: Partial<OffboardStep>) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }
  function resetSteps() {
    setSteps(DEFAULT_STEPS.map(s => ({ ...s, status: "pending" as const, message: undefined })));
  }

  async function runOffboardingWithStatus(email: string, employeeName?: string, userId?: string, hasLaptop?: boolean, collectionAddress?: string) {
    setStatus("processing");
    resetSteps();

    // Show all steps as running immediately
    updateStep("google", { status: "running", message: "Suspending Google Workspace account..." });
    updateStep("okta", { status: "running", message: "Deactivating Okta user..." });
    updateStep("m365", { status: "running", message: "Blocking M365 sign-in..." });
    updateStep("slack", { status: "running", message: "Removing from Slack workspaces..." });
    updateStep("snipeit", { status: "running", message: "Marking asset for return..." });
    updateStep("mdm", { status: "running", message: "Initiating remote wipe..." });

    try {
      // Call the public trigger endpoint — no auth session required
      const res = await fetch('/api/offboarding/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, employeeName, userId, hasLaptop, collectionAddress }),
      });

      const result = await res.json();

      if (res.ok && result.results) {
        const r = result.results;
        const map: Record<string, string> = {
          google: "google", okta: "okta", m365: "m365",
          slack: "slack", snipeit: "snipeit", mdm: "mdm"
        };
        for (const [key, stepId] of Object.entries(map)) {
          const stepResult = r[key];
          if (stepResult) {
            updateStep(stepId, {
              status: stepResult.success ? "success" : "error",
              message: stepResult.message,
            });
          }
        }
        setStatus(result.success ? "success" : "error");
      } else {
        // API not fully connected — show setup instructions
        const messages: Record<string, string> = {
          google: `Configure GOOGLE_SERVICE_ACCOUNT_KEY in .env`,
          okta: `Configure OKTA_API_TOKEN in .env`,
          m365: `Configure AZURE_CLIENT_SECRET in .env`,
          slack: `Configure SLACK_BOT_TOKEN in .env`,
          snipeit: `Configure SNIPEIT_API_KEY in .env`,
          mdm: `Configure JAMF or SCALEFUSION keys in .env`,
        };
        Object.entries(messages).forEach(([id, msg]) =>
          updateStep(id, { status: "error" as const, message: msg })
        );
        setStatus("error");
      }
    } catch (err: any) {
      setStatus("error");
      ["google","okta","m365","slack","snipeit","mdm"].forEach(s =>
        updateStep(s, { status: "error", message: err.message })
      );
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("confirm") !== "on") {
      alert("Please confirm the action before proceeding.");
      return;
    }
    await runOffboardingWithStatus(
      fd.get("email") as string,
      fd.get("employeeName") as string,
      fd.get("userId") as string,
      fd.get("hasLaptop") === "on",
      fd.get("collectionAddress") as string,
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: (r) => setCsvData(r.data as OffboardEmployee[]) });
  };

  const handleBulkProcess = async () => {
    setStatus("processing");
    setResults({ success: 0, failed: 0 });
    for (let i = 0; i < csvData.length; i++) {
      setProcessingIndex(i);
      try {
        await runOffboardingWithStatus(csvData[i].email, undefined, csvData[i].userId);
        setResults(prev => ({ ...prev, success: prev.success + 1 }));
      } catch {
        setResults(prev => ({ ...prev, failed: prev.failed + 1 }));
      }
      await new Promise(r => setTimeout(r, 500));
    }
    setProcessingIndex(-1);
    setStatus("success");
  };

  const downloadTemplate = () => {
    const csv = "email,userId,reason\njohn.doe@company.com,12345,Resignation\njane.smith@company.com,67890,Contract End";
    const blob = new Blob([csv], { type: "text/csv" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "offboarding_template.csv" });
    a.click();
  };

  const inputCls = "w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-sm";
  const labelCls = "block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 lg:p-10 pb-20">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="p-3 bg-rose-500/10 rounded-2xl">
          <UserX className="w-8 h-8 text-rose-500" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
            Employee Offboarding
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Securely revoke access across all connected platforms.</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="mb-6 flex gap-2 p-1 bg-white/40 dark:bg-white/5 rounded-xl border border-white/20 w-fit">
        {(["single", "bulk"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} className={cn(
            "px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            mode === m ? "bg-rose-600 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
          )}>
            {m === "single" ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            {m === "single" ? "Single Employee" : "Bulk Upload"}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {mode === "single" ? (
              <motion.div key="single" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="glass-panel p-8 rounded-3xl border-l-4 border-rose-500/40 space-y-6">
                {/* Warning */}
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-700 dark:text-rose-300 text-sm">Irreversible Action</p>
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">This will immediately revoke access to Google Workspace, Okta, Slack, M365, and all connected tools. Ensure you have confirmed this with the employee and their manager.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div><label className={labelCls}>Employee Email *</label><input name="email" type="email" required className={inputCls} placeholder="employee@company.com" /></div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className={labelCls}>Employee Name</label><input name="employeeName" className={inputCls} placeholder="Jane Smith" /></div>
                    <div><label className={labelCls}>User ID / Employee ID</label><input name="userId" className={inputCls} placeholder="EMP-12345" /></div>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-white/20 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" name="hasLaptop" id="hasLaptop" className="w-4 h-4 rounded" />
                      <label htmlFor="hasLaptop" className="text-sm font-semibold cursor-pointer">Employee has a company device to collect</label>
                    </div>
                    <div>
                      <label className={labelCls}>Collection Address</label>
                      <input name="collectionAddress" className={inputCls} placeholder="123 Main St, City, State ZIP" />
                      <p className="text-xs text-muted-foreground mt-1">IT team will be notified to schedule a pickup</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-white/30 dark:bg-white/5 rounded-xl border border-rose-200 dark:border-rose-900/30">
                    <input type="checkbox" name="confirm" id="confirm" required className="w-4 h-4 rounded" />
                    <label htmlFor="confirm" className="text-sm font-semibold cursor-pointer">I confirm this offboarding and understand it cannot be undone</label>
                  </div>

                  <button type="submit" disabled={status === "processing"}
                    className="w-full py-4 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white rounded-2xl font-bold shadow-xl shadow-rose-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm">
                    {status === "processing" ? <><Loader2 className="w-5 h-5 animate-spin" /> Revoking access across all systems...</> : <><UserX className="w-5 h-5" /> Initiate Offboarding</>}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="bulk" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="glass-panel p-8 rounded-3xl space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-lg">Bulk Offboarding</h2>
                  <button onClick={downloadTemplate} className="glass-card px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <Download className="w-4 h-4" /> Template
                  </button>
                </div>

                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-600 dark:text-rose-400">Verify your CSV carefully — this will process revocations for all listed employees.</p>
                </div>

                <div className="border-2 border-dashed border-rose-300 dark:border-rose-800 rounded-2xl p-12 text-center hover:bg-rose-50/50 dark:hover:bg-rose-950/10 transition-colors">
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload-off" />
                  <label htmlFor="csv-upload-off" className="cursor-pointer">
                    <Upload className="w-10 h-10 mx-auto mb-3 text-rose-500" />
                    <p className="font-bold mb-1">Upload CSV File</p>
                    <p className="text-sm text-muted-foreground">email, userId, reason columns</p>
                  </label>
                </div>

                {csvData.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-semibold"><FileText className="w-4 h-4 inline mr-1.5" />{csvData.length} employees loaded</p>
                      <button onClick={handleBulkProcess} disabled={status === "processing"}
                        className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                        {status === "processing" ? <><Loader2 className="w-4 h-4 animate-spin" />Processing {processingIndex + 1}/{csvData.length}</> : <><UserX className="w-4 h-4" />Run All</>}
                      </button>
                    </div>
                    <div className="max-h-72 overflow-auto rounded-2xl border border-white/20">
                      <table className="w-full text-sm">
                        <thead className="bg-white/50 dark:bg-white/5 sticky top-0">
                          <tr>{["Email","User ID","Reason"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {csvData.map((emp, i) => (
                            <tr key={i} className={cn("border-t border-white/5", processingIndex === i && "bg-rose-500/10")}>
                              <td className="px-4 py-3 font-medium">{emp.email}</td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{emp.userId || '—'}</td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{emp.reason || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Revocation Checklist Sidebar */}
        <div className="space-y-4">
          <OffboardChecklist steps={steps} />

          {status === "success" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Offboarding Complete</span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">All access revoked. Device return scheduled. Audit entry created.</p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <span className="font-bold text-rose-700 dark:text-rose-400 text-sm">Partial Completion</span>
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-500">Some steps failed. Manual follow-up required. Check revocation status above.</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
