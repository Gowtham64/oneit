'use client';

import { useChat } from "@ai-sdk/react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ChatInterface() {
    // Generate unique session ID for this chat session
    const [sessionId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: "/api/chat",
        initialMessages: [],
        body: {
            sessionId,
        }
    } as any) as any;

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col h-[600px] glass-panel rounded-3xl overflow-hidden shadow-2xl"
        >
            <div className="flex items-center p-6 border-b border-white/10 bg-white/40 dark:bg-black/20">
                <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg shadow-lg shadow-emerald-500/20 mr-4">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground">AI Assistant</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/20">
                {messages.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-center text-muted-foreground mt-20"
                    >
                        <div className="w-16 h-16 bg-white/50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                            <Sparkles className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h4 className="font-semibold text-foreground mb-2">How can I help you?</h4>
                        <p className="text-sm max-w-xs mx-auto">Ask me to onboard an employee, check asset status, or managing offboarding.</p>
                    </motion.div>
                )}

                <AnimatePresence>
                    {messages.map((m: any) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={cn(
                                "flex w-full",
                                m.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-2xl p-4 text-sm shadow-sm",
                                    m.role === "user"
                                        ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-none"
                                        : "bg-white/60 dark:bg-white/10 text-foreground border border-white/20 rounded-bl-none"
                                )}
                            >
                                <div className="flex items-center mb-1 opacity-70 text-[10px] uppercase tracking-wider font-bold">
                                    {m.role === "user" ? <User size={10} className="mr-1" /> : <Bot size={10} className="mr-1" />}
                                    <span>{m.role}</span>
                                </div>
                                <div className="whitespace-pre-wrap leading-relaxed">
                                    {m.content}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-white/40 dark:bg-black/20 flex gap-3 items-center">
                <input
                    value={input || ""}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 bg-white/50 dark:bg-black/20 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-muted-foreground/50"
                    disabled={isLoading}
                />
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isLoading || !input?.trim()}
                    className="p-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/40 transition-shadow"
                >
                    <Send className="w-5 h-5" />
                </motion.button>
            </form>
        </motion.div>
    );
}
