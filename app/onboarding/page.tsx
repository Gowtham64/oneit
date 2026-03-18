"use client";

import { useState } from "react";
import {
  Loader2, CheckCircle, AlertCircle, Sparkles, Upload,
  FileText, Download, Users, User, Mail, Building, Laptop,
  Shield, MessageSquare, Chrome, Briefcase, Package,
  UserPlus, ChevronRight, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";

type Employee = {
  firstName: string; lastName: string; email: string;
  personalEmail?: string; phone?: string; department: string;
  jobTitle: string; startDate?: string; employeeId?: string;
  manager?: string; laptopRequired?: string; laptopOS?: string;
  laptopType?: string; laptopConfig?: string; laptopNotes?: string;
};

type IntegrationStep = {
  id: string; label: string; icon: React.ElementType;
  status: "pending" | "running" | "success" | "error"; message?: string;
};

const DEFAULT_STEPS: IntegrationStep[] = [
  { id: "google", label: "Google Workspace", icon: Chrome, status: "pending" },
  { id: "okta", label: "Okta Identity", icon: Shield, status: "pending" },
  { id: "m365", label: "Microsoft 365", icon: Mail, status: "pending" },
  { id: "slack", label: "Slack Workspace", icon: MessageSquare, status: "pending" },
  { id: "snipeit", label: "Snipe-IT Asset Assign", icon: Package, status: "pending" },
  { id: "mdm", label: "MDM Enrollment", icon: Laptop, status: "pending" },
];

function IntegrationChecklist({ steps }: { steps: IntegrationStep[] }) {
  return (
    <div className="glass-panel p-6 rounded-3xl space-y-3">
      <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Integration Status</h3>
      {steps.map((step) => (
        <div key={step.id} className="flex items-center gap-3 py-2">
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all",
            step.status === "success" ? "bg-emerald-500/10" :
            step.status === "error" ? "bg-rose-500/10" :
            step.status === "running" ? "bg-indigo-500/10" : "bg-slate-100 dark:bg-slate-800"
          )}>
            {step.status === "running" ? (
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
            ) : step.status === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : step.status === "error" ? (
              <X className="w-4 h-4 text-rose-500" />
            ) : (
              <step.icon className="w-4 h-4 text-muted-foreground/50" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{step.label}</div>
            {step.message && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{step.message}</p>
            )}
          </div>
          <div className={cn(
            "text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ml-2 shrink-0",
            step.status === "success" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
            step.status === "error" ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" :
            step.status === "running" ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" :
            "text-muted-foreground/50"
          )}>
            {step.status === "pending" ? "Queued" : step.status}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [steps, setSteps] = useState<IntegrationStep[]>(DEFAULT_STEPS);
  const [csvData, setCsvData] = useState<Employee[]>([]);
  const [processingIndex, setProcessingIndex] = useState(-1);
  const [results, setResults] = useState({ success: 0, failed: 0 });

  function updateStep(id: string, updates: Partial<IntegrationStep>) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }

  function resetSteps() {
    setSteps(DEFAULT_STEPS.map(s => ({ ...s, status: "pending", message: undefined })));
  }

  async function runOnboardingWithStatus(data: {
    firstName: string; lastName: string; email: string;
    department: string; jobTitle: string; [key: string]: any;
  }) {
    setStatus("processing");
    resetSteps();

    // Set all steps to running immediately to show activity
    updateStep("google", { status: "running", message: "Creating Google Workspace account..." });
    updateStep("okta", { status: "running", message: "Provisioning Okta identity..." });
    updateStep("m365", { status: "running", message: "Setting up M365 mailbox..." });
    updateStep("slack", { status: "running", message: "Sending Slack invite..." });
    updateStep("snipeit", { status: "running", message: "Searching for available asset..." });
    updateStep("mdm", { status: "running", message: "Triggering MDM enrollment..." });

    try {
      // Call the public trigger endpoint — no auth session required
      const res = await fetch('/api/onboarding/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok && result.results) {
        // Apply per-integration results from the server
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
        // API not fully connected — show graceful fallback
        const steps = ["google", "okta", "m365", "slack", "snipeit", "mdm"];
        const messages: Record<string, string> = {
          google: `${data.email} — configure GOOGLE_SERVICE_ACCOUNT_KEY in .env`,
          okta: `Configure OKTA_API_TOKEN in .env`,
          m365: `Configure AZURE_CLIENT_SECRET in .env`,
          slack: `Configure SLACK_BOT_TOKEN in .env`,
          snipeit: `Configure SNIPEIT_API_KEY in .env`,
          mdm: `Configure JAMF or SCALEFUSION keys in .env`,
        };
        steps.forEach(s => updateStep(s, { status: "warning" as any, message: messages[s] }));
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
    const formData = new FormData(e.currentTarget);
    const data: any = {};
    formData.forEach((v, k) => { data[k] = v; });
    await runOnboardingWithStatus(data);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (r) => setCsvData(r.data as Employee[]),
    });
  };

  const handleBulkProcess = async () => {
    setStatus("processing");
    setResults({ success: 0, failed: 0 });
    for (let i = 0; i < csvData.length; i++) {
      setProcessingIndex(i);
      try {
        await runOnboardingWithStatus(csvData[i] as any);
        setResults(prev => ({ ...prev, success: prev.success + 1 }));
      } catch {
        setResults(prev => ({ ...prev, failed: prev.failed + 1 }));
      }
      await new Promise(r => setTimeout(r, 1200));
    }
    setProcessingIndex(-1);
    setStatus("success");
  };

  const downloadTemplate = async () => {
    try {
      const res = await fetch('/api/reports/template/onboarding');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: 'onboarding_template.csv' }).click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download template.');
    }
  };

  const inputCls = "w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm";
  const labelCls = "block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 lg:p-10 pb-20">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="p-3 bg-indigo-500/10 rounded-2xl">
          <UserPlus className="w-8 h-8 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
            Employee Onboarding
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Automate provisioning across all connected platforms.</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="mb-6 flex gap-2 p-1 bg-white/40 dark:bg-white/5 rounded-xl border border-white/20 w-fit">
        {(["single", "bulk"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} className={cn(
            "px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            mode === m ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
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
                className="glass-panel p-8 rounded-3xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Personal</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div><label className={labelCls}>First Name *</label><input name="firstName" required className={inputCls} placeholder="Jane" /></div>
                      <div><label className={labelCls}>Last Name *</label><input name="lastName" required className={inputCls} placeholder="Smith" /></div>
                      <div><label className={labelCls}>Company Email *</label><input name="email" type="email" required className={inputCls} placeholder="jane.smith@company.com" /></div>
                      <div><label className={labelCls}>Personal Email</label><input name="personalEmail" type="email" className={inputCls} placeholder="jane@gmail.com" /></div>
                      <div><label className={labelCls}>Phone</label><input name="phone" className={inputCls} placeholder="+1 555 0001" /></div>
                      <div><label className={labelCls}>Employee ID</label><input name="employeeId" className={inputCls} placeholder="EMP-001" /></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Employment</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Department *</label>
                        <select name="department" required className={inputCls}>
                          <option value="">Select...</option>
                          {["Engineering","Product","Sales","Marketing","HR","Finance","Operations","Customer Success"].map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div><label className={labelCls}>Job Title *</label><input name="jobTitle" required className={inputCls} placeholder="Software Engineer" /></div>
                      <div><label className={labelCls}>Start Date</label><input name="startDate" type="date" className={inputCls} /></div>
                      <div><label className={labelCls}>Manager</label><input name="manager" className={inputCls} placeholder="John Manager" /></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Laptop className="w-4 h-4" /> Hardware</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Device Required</label>
                        <select name="laptopRequired" className={inputCls}>
                          <option value="yes">Yes</option><option value="no">No</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Operating System</label>
                        <select name="laptopOS" className={inputCls}>
                          <option value="">Select OS</option>
                          <option value="macOS">macOS (JAMF)</option>
                          <option value="Windows">Windows (Scalefusion)</option>
                          <option value="Linux">Linux</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Device Type</label>
                        <select name="laptopType" className={inputCls}>
                          <option value="">Select model</option>
                          {["MacBook Air","MacBook Pro 14\"","MacBook Pro 16\"","Dell XPS 15","Lenovo ThinkPad X1","HP EliteBook 840","Surface Laptop"].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Configuration</label>
                        <select name="laptopConfig" className={inputCls}>
                          <option value="">Select config</option>
                          {["Basic – 8GB / 256GB","Standard – 16GB / 512GB","Advanced – 32GB / 1TB","Pro – 64GB / 2TB"].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className={labelCls}>Additional Requirements</label>
                      <textarea name="laptopNotes" rows={2} className={cn(inputCls, "resize-none")} placeholder="Special software, accessories..." />
                    </div>
                  </div>

                  <button type="submit" disabled={status === "processing"}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm">
                    {status === "processing" ? <><Loader2 className="w-5 h-5 animate-spin" /> Provisioning across all systems...</> : <><Sparkles className="w-5 h-5" /> Start Full Onboarding</>}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="bulk" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="glass-panel p-8 rounded-3xl space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-lg">Bulk Onboarding</h2>
                  <button onClick={downloadTemplate} className="glass-card px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <Download className="w-4 h-4" /> Template
                  </button>
                </div>

                <div className="border-2 border-dashed border-indigo-300 dark:border-indigo-800 rounded-2xl p-12 text-center hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors">
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <Upload className="w-10 h-10 mx-auto mb-3 text-indigo-500" />
                    <p className="font-bold mb-1">Upload CSV File</p>
                    <p className="text-sm text-muted-foreground">Click to browse or drag and drop</p>
                  </label>
                </div>

                {csvData.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-semibold"><FileText className="w-4 h-4 inline mr-1.5" />{csvData.length} employees loaded</p>
                      <button onClick={handleBulkProcess} disabled={status === "processing"}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                        {status === "processing" ? <><Loader2 className="w-4 h-4 animate-spin" />Processing {processingIndex + 1}/{csvData.length}</> : <><Sparkles className="w-4 h-4" />Run All</>}
                      </button>
                    </div>
                    <div className="max-h-72 overflow-auto rounded-2xl border border-white/20">
                      <table className="w-full text-sm">
                        <thead className="bg-white/50 dark:bg-white/5 sticky top-0">
                          <tr>{["Name","Email","Dept","Title"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {csvData.map((emp, i) => (
                            <tr key={i} className={cn("border-t border-white/5", processingIndex === i && "bg-indigo-500/10")}>
                              <td className="px-4 py-3 font-medium">{emp.firstName} {emp.lastName}</td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{emp.email}</td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{emp.department}</td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{emp.jobTitle}</td>
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

        {/* Integration Checklist Sidebar */}
        <div className="space-y-4">
          <IntegrationChecklist steps={steps} />

          {status === "success" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Onboarding Complete</span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">All integrations provisioned successfully. Audit log entry created.</p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <span className="font-bold text-rose-700 dark:text-rose-400 text-sm">Some Steps Failed</span>
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-500">Check the integration status above. You can retry failed steps individually.</p>
            </motion.div>
          )}

          <div className="glass-card p-5 rounded-2xl">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">How It Works</h4>
            <div className="space-y-3">
              {[
                { icon: UserPlus, label: "Employee Created", desc: "Record saved to database" },
                { icon: Shield, label: "Identity Setup", desc: "Google, Okta, M365 provisioned" },
                { icon: MessageSquare, label: "Notified", desc: "Slack invite + welcome email" },
                { icon: Package, label: "Asset Assigned", desc: "Snipe-IT laptop allocated" },
                { icon: Laptop, label: "MDM Enrolled", desc: "JAMF or Scalefusion triggered" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <s.icon className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{s.label}</div>
                    <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
