"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserPlus, UserMinus, Box, Bot, MessageSquare, Settings, LogOut, Shield, FileText, Laptop, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Onboarding", href: "/onboarding", icon: UserPlus },
    { name: "Offboarding", href: "/offboarding", icon: UserMinus },
    { name: "Assets", href: "/assets", icon: Box },
    { name: "Devices", href: "/devices", icon: Laptop },
    { name: "Compliance", href: "/compliance", icon: Shield },
    { name: "Audit Logs", href: "/audit", icon: FileText },
    { name: "AI Agent", href: "/chat", icon: Bot },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = session?.user?.role;

    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
    const isSuperAdmin = userRole === "SUPER_ADMIN";

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-white/20 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-xl z-50 overflow-hidden"
        >
            <div className="p-6">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                        1
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                        OneIT
                    </span>
                    {userRole && (
                        <span className="ml-auto text-xs font-mono uppercase px-2 py-1 bg-white/50 dark:bg-white/10 rounded">
                            {userRole.replace('_', ' ')}
                        </span>
                    )}
                </div>

                <nav className="space-y-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                                    isActive
                                        ? "text-white shadow-lg shadow-indigo-500/25"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <item.icon className={cn("w-5 h-5 relative z-10", isActive ? "text-white" : "text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors")} />
                                <span className="relative z-10">{item.name}</span>
                            </Link>
                        );
                    })}

                    {/* Admin-only Chat History Link */}
                    {isAdmin && (
                        <Link
                            href="/admin/chat-history"
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                                pathname.startsWith('/admin/chat-history')
                                    ? "text-white shadow-lg shadow-purple-500/25"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10"
                            )}
                        >
                            {pathname.startsWith('/admin/chat-history') && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-600"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <MessageSquare className={cn("w-5 h-5 relative z-10", pathname.startsWith('/admin/chat-history') ? "text-white" : "text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors")} />
                            <span className="relative z-10">Chat History</span>
                        </Link>
                    )}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-white/10 dark:border-white/5 bg-white/30 dark:bg-black/10">
                <Link href="/settings" className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10 transition-all mb-2">
                    <Settings className="w-4 h-4" />
                    Settings
                </Link>
                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </motion.div>
    );
}
