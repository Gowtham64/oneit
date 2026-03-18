import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSuperAdmin, errorResponse, successResponse } from '@/lib/api-middleware';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authResult = await requireAdminOrSuperAdmin(req);
        if (authResult.error) return authResult.response;

        const conversation = await prisma.chatConversation.findUnique({
            where: { id: params.id },
            include: {
                messages: {
                    orderBy: { timestamp: 'asc' }
                }
            }
        });

        if (!conversation) {
            return errorResponse('Conversation not found', 404);
        }

        return successResponse(conversation);
    } catch (error: any) {
        console.error('Error fetching conversation:', error);
        return errorResponse(error.message || 'Failed to fetch conversation', 500);
    }
}
