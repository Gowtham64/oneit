"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, Save, Search, UserCog, MoreVertical, Plus, Trash2, X, Link2, CheckCircle, AlertTriangle, RefreshCw, Lock, FileText, Download, Calendar, Webhook, Copy, Eye, EyeOff } from "lucide-react";

// Mock data until DB is connected
const MOCK_USERS = [
    { id: "1", name: "Admin User", email: "admin@example.com", role: "ADMIN", avatar: "A" },
    { id: "2", name: "Jane Doe", email: "jane@example.com", role: "USER", avatar: "J" },
    { id: "3", name: "John Smith", email: "john@example.com", role: "USER", avatar: "JS" },
];

const INTEGRATIONS = [
    { id: "google", name: "Google Workspace", icon: "https://www.google.com/favicon.ico", status: "connected", description: "User provisioning and directory management." },
    { id: "slack", name: "Slack", icon: "https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png", status: "connected", description: "Channel invitations and messaging." },
    { id: "okta", name: "Okta", icon: "https://www.okta.com/sites/default/files/favicon.ico", status: "error", description: "Identity management and SSO." },
    { id: "microsoft", name: "Microsoft 365", icon: "https://res-1.cdn.office.net/files/fabric-cdn-prod_20230815.002/assets/brand-icons/product/svg/office_48x1.svg", status: "connected", description: "Azure AD user management." },
    { id: "snipeit", name: "Snipe-IT", icon: "https://snipeitapp.com/img/favicon.ico", status: "connected", description: "Asset and license tracking." },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("users");
    const [users, setUsers] = useState(MOCK_USERS);
    const [integrations, setIntegrations] = useState(INTEGRATIONS);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Modals State
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState<string | null>(null);

    const [newUser, setNewUser] = useState({ name: "", email: "", role: "USER" });
    const [newService, setNewService] = useState({ name: "", description: "" });
    const [configData, setConfigData] = useState({ apiKey: "", apiUrl: "" });

    // HRMS Integration State
    const [webhookSecret, setWebhookSecret] = useState("••••••••••••••••");
    const [showWebhookSecret, setShowWebhookSecret] = useState(false);
    const [autoProvision, setAutoProvision] = useState(true);

    // Security Policy State
    const [mfaRequired, setMfaRequired] = useState(true);
    const [passwordMinLength, setPasswordMinLength] = useState(12);
    const [sessionTimeout, setSessionTimeout] = useState(30);
    const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
    const [auditLoggingEnabled, setAuditLoggingEnabled] = useState(true);

    // --- User Management Handlers ---
    const handleRoleChange = (userId: string, newRole: string) => {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    };

    const handleDeleteUser = (userId: string) => {
        if (confirm("Are you sure you want to remove this user?")) {
            setUsers(users.filter(u => u.id !== userId));
        }
    };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        const id = Math.random().toString(36).substr(2, 9);
        const avatar = newUser.name.charAt(0).toUpperCase();
        setUsers([...users, { id, ...newUser, avatar }]);
        setNewUser({ name: "", email: "", role: "USER" });
        setIsAddUserModalOpen(false);
    };

    // --- Integration Handlers ---
    const handleAddService = (e: React.FormEvent) => {
        e.preventDefault();
        const id = newService.name.toLowerCase().replace(/\s+/g, "-");
        setIntegrations([...integrations, {
            id,
            name: newService.name,
            icon: "https://via.placeholder.com/32", // Placeholder icon
            status: "connected",
            description: newService.description
        }]);
        setNewService({ name: "", description: "" });
        setIsAddServiceModalOpen(false);
    };

    const handleSaveConfig = (e: React.FormEvent) => {
        e.preventDefault();
        setIsConfigModalOpen(null);
        setConfigData({ apiKey: "", apiUrl: "" });
        alert("Configuration saved (Mock)");
    };

    const handleSave = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
        alert("Changes saved successfully (Mock)");
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 max-w-6xl mx-auto"
        >
            <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="p-3 bg-gray-500/10 rounded-2xl text-gray-600 dark:text-gray-400"
                    >
                        <UserCog className="w-8 h-8" />
                    </motion.div>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900 dark:from-white dark:to-gray-400">
                            Settings
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Manage system access and integrations.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="md:col-span-1 space-y-2">
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors ${activeTab === "users"
                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : "hover:bg-white/50 dark:hover:bg-white/5 text-muted-foreground"
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        User Management
                    </button>
                    <button
                        onClick={() => setActiveTab("integrations")}
                        className={`w-full text-left px-4 py-3 rounded-xl font-medium flex items-center gap-3 transition-colors ${activeTab === "integrations"
                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : "hover:bg-white/50 dark:hover:bg-white/5 text-muted-foreground"
                            }`}
                    >
                        <Link2 className="w-4 h-4" />
                        Integrations
                    </button>
                    <button
                        onClick={() => setActiveTab("security")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "security" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5"}`}
                    >
                        <Shield className="w-5 h-5" />
                        Security Policies
                    </button>

                    <button
                        onClick={() => setActiveTab("hrms")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "hrms" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5"}`}
                    >
                        <Webhook className="w-5 h-5" />
                        HRMS Integration
                    </button>

                    <button
                        onClick={() => setActiveTab("reports")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "reports" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5"}`}
                    >
                        <FileText className="w-5 h-5" />
                        Reports
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-3">
                    <div className="glass-panel p-6 rounded-3xl min-h-[500px]">

                        {/* Users Tab */}
                        {activeTab === "users" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Users className="w-5 h-5 text-indigo-500" />
                                        User Roles
                                    </h2>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsAddUserModalOpen(true)}
                                            className="px-4 py-2 bg-white/50 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 text-foreground rounded-lg text-sm font-medium flex items-center gap-2 transition-all border border-white/20"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add User
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isLoading}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                                        >
                                            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save Changes
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-6 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-black/20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>

                                <div className="space-y-3">
                                    {filteredUsers.map((user) => (
                                        <motion.div
                                            key={user.id}
                                            layout
                                            className="p-4 bg-white/40 dark:bg-white/5 rounded-xl border border-white/20 flex items-center justify-between group hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
                                                    {user.avatar}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium border cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100 dark:bg-white/10"
                                                >
                                                    <option value="USER">User</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>
                                                <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-muted-foreground hover:text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Integrations Tab */}
                        {activeTab === "integrations" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Link2 className="w-5 h-5 text-indigo-500" />
                                        Connected Services
                                    </h2>
                                    <button
                                        onClick={() => setIsAddServiceModalOpen(true)}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add New Service
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {integrations.map((tool) => (
                                        <motion.div
                                            key={tool.id}
                                            className="p-5 bg-white/40 dark:bg-white/5 rounded-2xl border border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white p-2 shadow-sm flex items-center justify-center">
                                                    <img src={tool.icon} alt={tool.name} className="w-8 h-8 object-contain" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                                                        {tool.name}
                                                        {tool.status === "connected" && (
                                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">Active</span>
                                                        )}
                                                        {tool.status === "error" && (
                                                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 text-[10px] font-bold uppercase tracking-wider border border-red-500/20">Error</span>
                                                        )}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setIsConfigModalOpen(tool.id)}
                                                    className="px-4 py-2 bg-white/50 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 text-foreground rounded-lg text-sm font-medium transition-all border border-white/20"
                                                >
                                                    Configure
                                                </button>
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Security Tab */}
                        {activeTab === "security" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
                                        <Shield className="w-5 h-5 text-indigo-500" />
                                        Security Policies
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Configure security settings and access controls for your organization.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {/* Multi-Factor Authentication */}
                                    <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                                    <Lock className="w-5 h-5 text-emerald-500" />
                                                    Multi-Factor Authentication (MFA)
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Require all users to enable MFA for enhanced account security.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setMfaRequired(!mfaRequired)}
                                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${mfaRequired ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            >
                                                <span
                                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${mfaRequired ? 'translate-x-7' : 'translate-x-1'}`}
                                                />
                                            </button>
                                        </div>
                                        <div className={`p-4 rounded-lg ${mfaRequired ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-500/10 border border-gray-500/20'}`}>
                                            <p className="text-sm font-medium">
                                                {mfaRequired ? '✅ MFA is REQUIRED for all users' : '⚠️ MFA is OPTIONAL'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {mfaRequired
                                                    ? 'Users must set up authenticator app or SMS verification.'
                                                    : 'Users can choose to enable MFA for their accounts.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Password Requirements */}
                                    <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <Lock className="w-5 h-5 text-amber-500" />
                                            Password Requirements
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">
                                                    Minimum Password Length: {passwordMinLength} characters
                                                </label>
                                                <input
                                                    type="range"
                                                    min="8"
                                                    max="20"
                                                    value={passwordMinLength}
                                                    onChange={(e) => setPasswordMinLength(parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                                                />
                                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                    <span>8</span>
                                                    <span>20</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                    <CheckCircle className="w-4 h-4 text-emerald-600 mb-1" />
                                                    <p className="text-xs font-medium">Uppercase Required</p>
                                                </div>
                                                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                    <CheckCircle className="w-4 h-4 text-emerald-600 mb-1" />
                                                    <p className="text-xs font-medium">Lowercase Required</p>
                                                </div>
                                                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                    <CheckCircle className="w-4 h-4 text-emerald-600 mb-1" />
                                                    <p className="text-xs font-medium">Number Required</p>
                                                </div>
                                                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                    <CheckCircle className="w-4 h-4 text-emerald-600 mb-1" />
                                                    <p className="text-xs font-medium">Special Char Required</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Session Management */}
                                    <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <RefreshCw className="w-5 h-5 text-blue-500" />
                                            Session Management
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">
                                                    Session Timeout: {sessionTimeout} minutes
                                                </label>
                                                <input
                                                    type="range"
                                                    min="15"
                                                    max="120"
                                                    step="15"
                                                    value={sessionTimeout}
                                                    onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                />
                                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                    <span>15 min</span>
                                                    <span>2 hours</span>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                                <p className="text-sm font-medium">
                                                    Users will be automatically logged out after {sessionTimeout} minutes of inactivity.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* IP Whitelisting */}
                                    <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                                    <Shield className="w-5 h-5 text-purple-500" />
                                                    IP Whitelisting
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Restrict access to specific IP addresses or ranges.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setIpWhitelistEnabled(!ipWhitelistEnabled)}
                                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${ipWhitelistEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            >
                                                <span
                                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${ipWhitelistEnabled ? 'translate-x-7' : 'translate-x-1'}`}
                                                />
                                            </button>
                                        </div>
                                        {ipWhitelistEnabled && (
                                            <div className="space-y-3">
                                                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 flex items-center justify-between">
                                                    <span className="text-sm font-mono">192.168.1.0/24</span>
                                                    <button className="text-red-500 hover:text-red-600">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 flex items-center justify-between">
                                                    <span className="text-sm font-mono">10.0.0.0/8</span>
                                                    <button className="text-red-500 hover:text-red-600">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all">
                                                    <Plus className="w-4 h-4" />
                                                    Add IP Address
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Audit Logging */}
                                    <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-indigo-500" />
                                                    Audit Logging
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Track all user actions and system events for compliance.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setAuditLoggingEnabled(!auditLoggingEnabled)}
                                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${auditLoggingEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            >
                                                <span
                                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${auditLoggingEnabled ? 'translate-x-7' : 'translate-x-1'}`}
                                                />
                                            </button>
                                        </div>
                                        <div className={`p-4 rounded-lg ${auditLoggingEnabled ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-gray-500/10 border border-gray-500/20'}`}>
                                            <p className="text-sm font-medium mb-2">
                                                {auditLoggingEnabled ? '✅ Audit logging is ENABLED' : '⚠️ Audit logging is DISABLED'}
                                            </p>
                                            {auditLoggingEnabled && (
                                                <div className="space-y-1 text-xs text-muted-foreground">
                                                    <p>• User login/logout events</p>
                                                    <p>• Employee onboarding/offboarding</p>
                                                    <p>• Asset assignments and changes</p>
                                                    <p>• Settings modifications</p>
                                                    <p>• Integration API calls</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Save Button */}
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => alert('Security policies saved successfully!')}
                                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save Security Policies
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* HRMS Integration Tab */}
                        {activeTab === "hrms" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
                                        <Webhook className="w-5 h-5 text-indigo-500" />
                                        HRMS Integration
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Configure webhook integration with your HRMS platform for automated employee provisioning.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {/* Webhook URL */}
                                    <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <Link2 className="w-5 h-5 text-indigo-500" />
                                            Webhook Endpoint
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Configure this URL in your HRMS platform to enable automatic onboarding/offboarding.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={`${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/webhooks/hrms`}
                                                readOnly
                                                className="flex-1 p-3 bg-gray-100 dark:bg-white/5 rounded-lg border-none font-mono text-sm"
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/hrms`);
                                                    alert('Webhook URL copied to clipboard!');
                                                }}
                                                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                                            >
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </button>
                                        </div>
                                    </div>

                                    {/* Webhook Secret */}
                                    <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <Lock className="w-5 h-5 text-amber-500" />
                                            Webhook Secret
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Use this secret key to sign webhook requests from your HRMS. Keep it secure!
                                        </p>
                                        <div className="flex items-center gap-2 mb-4">
                                            <input
                                                type={showWebhookSecret ? "text" : "password"}
                                                value={webhookSecret}
                                                readOnly
                                                className="flex-1 p-3 bg-gray-100 dark:bg-white/5 rounded-lg border-none font-mono text-sm"
                                            />
                                            <button
                                                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                                                className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-all"
                                            >
                                                {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (showWebhookSecret) {
                                                        navigator.clipboard.writeText(webhookSecret);
                                                        alert('Webhook secret copied to clipboard!');
                                                    } else {
                                                        alert('Please reveal the secret first');
                                                    }
                                                }}
                                                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                                            >
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newSecret = crypto.randomUUID();
                                                setWebhookSecret(newSecret);
                                                alert('New webhook secret generated! Update your HRMS configuration.');
                                            }}
                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Regenerate Secret
                                        </button>
                                    </div>

                                    {/* Auto-Provisioning Toggle */}
                                    <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                    Automatic Provisioning
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    When enabled, employee onboarding and offboarding will be automatically triggered by HRMS webhook events.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setAutoProvision(!autoProvision)}
                                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${autoProvision ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            >
                                                <span
                                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${autoProvision ? 'translate-x-7' : 'translate-x-1'}`}
                                                />
                                            </button>
                                        </div>
                                        <div className={`mt-4 p-4 rounded-lg ${autoProvision ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-500/10 border border-gray-500/20'}`}>
                                            <p className="text-sm font-medium">
                                                {autoProvision ? '✅ Auto-provisioning is ENABLED' : '⚠️ Auto-provisioning is DISABLED'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {autoProvision
                                                    ? 'Webhook events will automatically trigger onboarding/offboarding workflows.'
                                                    : 'Webhook events will be received but not processed automatically.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Supported Events */}
                                    <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20">
                                        <h3 className="font-semibold text-lg mb-4">Supported Webhook Events</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                <div>
                                                    <p className="font-medium text-sm">employee.hired / employee.created</p>
                                                    <p className="text-xs text-muted-foreground">Triggers automatic onboarding workflow</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-pink-500/10 rounded-lg border border-pink-500/20">
                                                <AlertTriangle className="w-5 h-5 text-pink-600" />
                                                <div>
                                                    <p className="font-medium text-sm">employee.terminated / employee.offboarded</p>
                                                    <p className="text-xs text-muted-foreground">Triggers automatic offboarding workflow</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                                <RefreshCw className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <p className="font-medium text-sm">employee.updated</p>
                                                    <p className="text-xs text-muted-foreground">Logged for future implementation</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Test Webhook */}
                                    <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20">
                                        <h3 className="font-semibold text-lg mb-4">Test Webhook</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Send a test webhook event to verify your integration is working correctly.
                                        </p>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch('/api/webhooks/hrms', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'x-hrms-signature': 'test-signature'
                                                        },
                                                        body: JSON.stringify({
                                                            event: 'employee.hired',
                                                            employee: {
                                                                email: 'test@example.com',
                                                                firstName: 'Test',
                                                                lastName: 'User'
                                                            }
                                                        })
                                                    });
                                                    const data = await response.json();
                                                    alert(`Test webhook sent! Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
                                                } catch (error) {
                                                    alert('Test webhook failed: ' + error);
                                                }
                                            }}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                                        >
                                            <Webhook className="w-4 h-4" />
                                            Send Test Event
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Reports Tab */}
                        {activeTab === "reports" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
                                        <FileText className="w-5 h-5 text-indigo-500" />
                                        System Reports
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Generate and download reports for onboarding, offboarding, and asset management activities.
                                    </p>
                                </div>

                                <div className="grid gap-4">
                                    <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                        <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <h3 className="font-semibold text-lg">Onboarding Activity Report</h3>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Comprehensive report of all onboarding activities including employee details, departments, start dates, and system provisioning status.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        const csv = "Date,Employee Name,Email,Department,Job Title,Status\\n2024-02-01,John Doe,john@company.com,Engineering,Software Engineer,Completed\\n2024-02-05,Jane Smith,jane@company.com,Marketing,Marketing Manager,Completed";
                                                        const blob = new Blob([csv], { type: 'text/csv' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `onboarding-report-${new Date().toISOString().split('T')[0]}.csv`;
                                                        a.click();
                                                    }}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download CSV
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20 hover:border-pink-300 dark:hover:border-pink-700 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-pink-500/10 rounded-lg">
                                                        <Calendar className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                                    </div>
                                                    <h3 className="font-semibold text-lg">Offboarding Activity Report</h3>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Complete record of offboarding activities including employee details, asset collection status, and system access revocation.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        const csv = "Date,Employee Name,Email,Department,Assets Collected,Status\\n2024-02-10,Bob Johnson,bob@company.com,Sales,Yes - Laptop Collected,Completed\\n2024-02-12,Alice Brown,alice@company.com,HR,No Assets,Completed";
                                                        const blob = new Blob([csv], { type: 'text/csv' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `offboarding-report-${new Date().toISOString().split('T')[0]}.csv`;
                                                        a.click();
                                                    }}
                                                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-pink-500/20"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download CSV
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20 hover:border-amber-300 dark:hover:border-amber-700 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-amber-500/10 rounded-lg">
                                                        <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                                    </div>
                                                    <h3 className="font-semibold text-lg">Asset Inventory Report</h3>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Full inventory report from Snipe-IT including asset tags, models, assigned users, and availability status.
                                                </p>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch('/api/assets/stats');
                                                            const data = await res.json();
                                                            const csv = `Asset Report - Generated ${new Date().toISOString()}\\n\\nTotal Assets,Available,Allocated\\n${data.total},${data.available},${data.allocated}\\n\\nNote: For detailed asset information, please access Snipe-IT directly.`;
                                                            const blob = new Blob([csv], { type: 'text/csv' });
                                                            const url = URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `asset-inventory-${new Date().toISOString().split('T')[0]}.csv`;
                                                            a.click();
                                                        } catch (error) {
                                                            alert('Failed to generate asset report');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download CSV
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white/30 dark:bg-white/5 rounded-xl border border-white/20 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                        <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <h3 className="font-semibold text-lg">System Activity Summary</h3>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Aggregated report showing all system activities including onboarding, offboarding, and integration health status.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        const csv = "Report Type,Count,Status\\nOnboarding (This Month),12,Active\\nOffboarding (This Month),3,Active\\nActive Integrations,5,Healthy\\nTotal Assets,156,Tracked\\nAvailable Assets,42,Ready";
                                                        const blob = new Blob([csv], { type: 'text/csv' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `system-activity-${new Date().toISOString().split('T')[0]}.csv`;
                                                        a.click();
                                                    }}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download CSV
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals Container */}
            <AnimatePresence>
                {/* Add User Modal */}
                {isAddUserModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddUserModalOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl z-10 border border-white/20"
                        >
                            <h3 className="text-xl font-bold mb-4">Add User</h3>
                            <form onSubmit={handleAddUser} className="space-y-4">
                                <input placeholder="Name" className="w-full p-3 bg-gray-100 dark:bg-white/5 rounded-xl border-none" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                                <input placeholder="Email" type="email" className="w-full p-3 bg-gray-100 dark:bg-white/5 rounded-xl border-none" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Save</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Add Service Modal */}
                {isAddServiceModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddServiceModalOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl z-10 border border-white/20"
                        >
                            <h3 className="text-xl font-bold mb-4">Add Integration</h3>
                            <form onSubmit={handleAddService} className="space-y-4">
                                <input placeholder="Service Name" className="w-full p-3 bg-gray-100 dark:bg-white/5 rounded-xl border-none" required value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} />
                                <textarea placeholder="Description" className="w-full p-3 bg-gray-100 dark:bg-white/5 rounded-xl border-none resize-none h-24" value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} />
                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="button" onClick={() => setIsAddServiceModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Add Service</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Configure Service Modal */}
                {isConfigModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsConfigModalOpen(null)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl z-10 border border-white/20"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold">Configure {integrations.find(i => i.id === isConfigModalOpen)?.name}</h3>
                            </div>

                            <form onSubmit={handleSaveConfig} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium ml-1 text-muted-foreground">API Endpoint URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://api.example.com"
                                        className="w-full p-3 mt-1 bg-gray-100 dark:bg-white/5 rounded-xl border-none"
                                        value={configData.apiUrl}
                                        onChange={e => setConfigData({ ...configData, apiUrl: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium ml-1 text-muted-foreground">API Key / Token</label>
                                    <input
                                        type="password"
                                        placeholder="sk_live_..."
                                        className="w-full p-3 mt-1 bg-gray-100 dark:bg-white/5 rounded-xl border-none font-mono"
                                        value={configData.apiKey}
                                        onChange={e => setConfigData({ ...configData, apiKey: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button type="button" onClick={() => setIsConfigModalOpen(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">Save Configuration</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
