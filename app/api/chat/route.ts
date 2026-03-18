import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { tools } from "@/agent/tools";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, sessionId } = await req.json();

    // Import prisma dynamically to avoid circular dependencies
    const { prisma } = await import('@/lib/prisma');

    // Get or create conversation
    let conversation = sessionId ? await prisma.chatConversation.findUnique({
        where: { sessionId }
    }).catch(() => null) : null;

    if (!conversation && sessionId) {
        // Try to get user info from session (optional)
        let userEmail: string | undefined;
        let userName: string | undefined;

        try {
            const { getServerSession } = await import('next-auth');
            const { authOptions } = await import('@/lib/auth');
            const session = await getServerSession(authOptions);
            if (session?.user) {
                userEmail = session.user.email || undefined;
                userName = session.user.name || undefined;
            }
        } catch (error) {
            // Session not available, continue without user info
        }

        conversation = await prisma.chatConversation.create({
            data: {
                sessionId,
                userEmail,
                userName,
            }
        });
    }

    // Save the latest user message if conversation exists
    if (conversation && messages.length > 0) {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage.role === 'user') {
            await prisma.chatMessage.create({
                data: {
                    conversationId: conversation.id,
                    role: 'USER',
                    content: latestMessage.content,
                }
            });
        }
    }

    const result = streamText({
        model: openai("gpt-4-turbo"),
        messages,
        system: `You are an AI assistant for Employee Onboarding and Offboarding.
    You have access to tools to manage users in Google Workspace, Slack, Okta, Microsoft 365, and Snipe-IT.
    
    When a user asks to onboard an employee, ask for any missing information (First Name, Last Name, Email) before calling the tool.
    When a user asks to offboard, confirm the email.
    
    Always be professional and helpful. Report back the results of the operations clearly.
    If an operation fails, report the error.
    `,
        tools: tools,
        onFinish: async (response) => {
            // Save AI response to database
            if (conversation) {
                try {
                    await prisma.chatMessage.create({
                        data: {
                            conversationId: conversation.id,
                            role: 'ASSISTANT',
                            content: response.text,
                            toolCalls: response.toolCalls ? JSON.parse(JSON.stringify(response.toolCalls)) : null,
                        }
                    });

                    // Update conversation metadata
                    await prisma.chatConversation.update({
                        where: { id: conversation.id },
                        data: {
                            messageCount: { increment: 2 }, // User + AI message
                            lastMessageAt: new Date(),
                        }
                    });
                } catch (error) {
                    console.error('Error saving AI response:', error);
                }
            }
        }
    });

    return result.toTextStreamResponse();
}
