"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Loader2, Laptop, Link2, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function AssetsPage() {
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [logs, setLogs] = useState<string[]>([]);

    const { append, isLoading } = useChat({
        onFinish: (message: any) => {
            if (message.toolInvocations) {
                setStatus("success");
                setLogs(prev => [...prev, "Asset assigned successfully."]);
            }
        },
        onError: (error: any) => {
            setStatus("error");
            setLogs(prev => [...prev, `Error: ${error.message}`]);
        }
    } as any) as any;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("processing");
        setLogs(["Processing asset assignment..."]);

        const formData = new FormData(e.currentTarget);
        const assetTag = formData.get("assetTag") as string;
        const userId = formData.get("userId") as string;

        setLogs(prev => [...prev, `Assigning Asset ${assetTag} to User ID ${userId}...`]);

        await append({
            role: "user",
            content: `Assign asset with tag ${assetTag} to Snipe-IT user ID ${userId}. Execute the assignAsset tool.`,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 max-w-4xl mx-auto"
        >
            <div className="mb-10 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center justify-center p-3 bg-orange-500/10 rounded-2xl mb-4 text-orange-600 dark:text-orange-400"
                >
                    <Box className="w-8 h-8" />
                </motion.div>
                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 mb-4">
                    Asset Management
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Assign hardware assets to employees in Snipe-IT.
                </p>
            </div>

            <div className="grid md:grid-cols-5 gap-8">
                <div className="md:col-span-3">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel p-8 rounded-3xl relative overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="assetTag" className="text-sm font-medium text-foreground/80">Asset Tag</label>
                                <div className="relative">
                                    <Laptop className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                                    <input
                                        id="assetTag"
                                        name="assetTag"
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-muted-foreground/50"
                                        placeholder="TAG-12345"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="userId" className="text-sm font-medium text-foreground/80">Snipe-IT User ID</label>
                                <div className="relative">
                                    <Link2 className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                                    <input
                                        id="userId"
                                        name="userId"
                                        required
                                        type="number"
                                        className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-muted-foreground/50"
                                        placeholder="42"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground ml-1">
                                    Ask the AI agent if you need to look up a User ID.
                                </p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={status === "processing" || isLoading}
                                className="w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {status === "processing" || isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Assigning Asset...
                                    </>
                                ) : (
                                    "Assign Asset"
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="glass-panel p-6 rounded-3xl h-full flex flex-col"
                    >
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
                            {status === "processing" && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
                            {status === "success" && <Box className="w-4 h-4 text-emerald-500" />}
                            {status === "error" && <Loader2 className="w-4 h-4 text-red-500" />}
                            {status === "idle" && <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />}
                            Live Logs
                        </h3>

                        <div className="flex-1 bg-white/30 dark:bg-black/20 rounded-xl p-4 overflow-y-auto max-h-[400px] border border-white/10 space-y-3 scrollbar-thin scrollbar-thumb-white/20">
                            {logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground/50 text-sm p-4">
                                    <p>Logs will appear here once started</p>
                                </div>
                            ) : (
                                logs.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-xs font-mono p-2 rounded bg-white/40 dark:bg-black/20 border-l-2 border-orange-400"
                                    >
                                        <span className="opacity-50 mr-2">{new Date().toLocaleTimeString()}</span>
                                        {log}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
