import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSuperAdmin, errorResponse, paginatedResponse } from '@/lib/api-middleware';

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireAdminOrSuperAdmin(req);
        if (authResult.error) return authResult.response;

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        // Build where clause
        const where: any = {};
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { userEmail: { contains: search, mode: 'insensitive' } },
                { userName: { contains: search, mode: 'insensitive' } },
                { topic: { contains: search, mode: 'insensitive' } },
            ];
        }

        const conversations = await prisma.chatConversation.findMany({
            where,
            include: {
                messages: {
                    take: 1,
                    orderBy: { timestamp: 'desc' },
                    select: {
                        content: true,
                        role: true,
                        timestamp: true,
                    }
                }
            },
            orderBy: { lastMessageAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const total = await prisma.chatConversation.count({ where });

        return paginatedResponse(conversations, total, page, limit);
    } catch (error: any) {
        console.error('Error fetching chat history:', error);
        return errorResponse(error.message || 'Failed to fetch chat history', 500);
    }
}
