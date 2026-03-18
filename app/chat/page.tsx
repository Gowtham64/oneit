import { ChatInterface } from "@/components/chat-interface";

export default function ChatPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">AI Agent</h1>
            <div className="max-w-3xl mx-auto">
                <ChatInterface />
            </div>
        </div>
    );
}
