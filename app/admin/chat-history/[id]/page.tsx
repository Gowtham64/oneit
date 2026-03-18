'use client';

import { useState, useEffect } from 'react';
import { Bot, User, ArrowLeft, Calendar, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Message {
    id: string;
    role: string;
    content: string;
    timestamp: string;
    toolCalls?: any;
}

interface Conversation {
    id: string;
    userName: string | null;
    userEmail: string | null;
    startedAt: string;
    lastMessageAt: string;
    messageCount: number;
    status: string;
    messages: Message[];
}

export default function ConversationDetailPage({ params }: { params: { id: string } }) {
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConversation();
    }, [params.id]);

    const fetchConversation = async () => {
        const res = await fetch(`/api/admin/chat-history/${params.id}`);
        const data = await res.json();

        if (data.success) {
            setConversation(data.data);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="glass-card p-12 rounded-xl text-center">
                    <h2 className="text-2xl font-bold mb-2">Conversation not found</h2>
                    <p className="text-muted-foreground mb-6">This conversation may have been deleted.</p>
                    <Link href="/admin/chat-history">
                        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            Back to Chat History
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <Link href="/admin/chat-history">
                <button className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Chat History
                </button>
            </Link>

            {/* Conversation Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-xl mb-6"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">
                            {conversation.userName || 'Anonymous User'}
                        </h1>
                        <p className="text-muted-foreground mb-4">{conversation.userEmail || 'No email'}</p>

                        <div className="flex flex-wrap gap-4 text-sm">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Started: {new Date(conversation.startedAt).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                {conversation.messageCount} messages
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${conversation.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600' :
                                    conversation.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-600' :
                                        'bg-gray-500/10 text-gray-600'
                                }`}>
                                {conversation.status}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Messages */}
            <div className="space-y-4">
                {conversation.messages.map((message, index) => (
                    <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl p-4 ${message.role === 'USER'
                                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-none'
                                    : 'bg-white/60 dark:bg-white/10 border border-white/20 rounded-bl-none'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2 text-xs opacity-70 font-medium">
                                {message.role === 'USER' ? (
                                    <User className="w-3 h-3" />
                                ) : (
                                    <Bot className="w-3 h-3" />
                                )}
                                <span>{message.role}</span>
                                <span>•</span>
                                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                            </div>

                            <div className="whitespace-pre-wrap leading-relaxed">
                                {message.content}
                            </div>

                            {message.toolCalls && Object.keys(message.toolCalls).length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/20">
                                    <div className="text-xs opacity-70 font-medium mb-1">🔧 Tool Calls:</div>
                                    <pre className="text-xs opacity-70 overflow-x-auto">
                                        {JSON.stringify(message.toolCalls, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
