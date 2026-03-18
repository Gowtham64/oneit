'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, User, Clock, Eye, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Conversation {
    id: string;
    userName: string | null;
    userEmail: string | null;
    startedAt: string;
    lastMessageAt: string;
    messageCount: number;
    status: string;
    messages: Array<{
        content: string;
        role: string;
        timestamp: string;
    }>;
}

export default function ChatHistoryPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchConversations();
    }, [search, statusFilter]);

    const fetchConversations = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (statusFilter) params.set('status', statusFilter);

        const res = await fetch(`/api/admin/chat-history?${params}`);
        const data = await res.json();

        if (data.success) {
            setConversations(data.data);
        }
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400">
                    AI Chat History
                </h1>
                <p className="text-muted-foreground mt-2">
                    Monitor all user conversations with the AI assistant
                </p>
            </motion.div>

            {/* Filters */}
            <div className="glass-card p-4 rounded-xl mb-6 flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by email, name, or topic..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-white/50 dark:bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                </select>
            </div>

            {/* Conversations List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <p className="mt-4 text-muted-foreground">Loading conversations...</p>
                </div>
            ) : conversations.length === 0 ? (
                <div className="glass-card p-12 rounded-xl text-center">
                    <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No conversations found</h3>
                    <p className="text-muted-foreground">
                        {search || statusFilter ? 'Try adjusting your filters' : 'Chat conversations will appear here'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {conversations.map((conv, index) => (
                        <motion.div
                            key={conv.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <ConversationCard conversation={conv} />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ConversationCard({ conversation }: { conversation: Conversation }) {
    return (
        <div className="glass-card p-6 rounded-xl hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-lg group-hover:from-purple-500/20 group-hover:to-violet-500/20 transition-colors">
                        <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>

                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                            {conversation.userName || 'Anonymous User'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {conversation.userEmail || 'No email provided'}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(conversation.lastMessageAt).toLocaleString()}
                            </span>
                            <span className="px-2 py-1 bg-purple-500/10 rounded-full">
                                {conversation.messageCount} messages
                            </span>
                            <span className={`px-2 py-1 rounded-full ${conversation.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600' :
                                    conversation.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-600' :
                                        'bg-gray-500/10 text-gray-600'
                                }`}>
                                {conversation.status}
                            </span>
                        </div>

                        {conversation.messages[0] && (
                            <p className="mt-3 text-sm text-muted-foreground line-clamp-2 bg-white/30 dark:bg-black/20 p-3 rounded-lg">
                                <span className="font-medium">{conversation.messages[0].role}:</span> {conversation.messages[0].content}
                            </p>
                        )}
                    </div>
                </div>

                <Link href={`/admin/chat-history/${conversation.id}`}>
                    <button className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors">
                        <Eye className="w-5 h-5" />
                    </button>
                </Link>
            </div>
        </div>
    );
}
