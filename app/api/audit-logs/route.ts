import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    requireAuth,
    validateQueryParams,
    handleApiError,
    paginatedResponse,
} from '@/lib/api-middleware';
import { auditLogQuerySchema } from '@/lib/validation-schemas';

// GET /api/audit-logs - List audit logs with filtering
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) return authResult.response;

        const queryResult = validateQueryParams(request, auditLogQuerySchema);
        if (queryResult.error) return queryResult.response;

        const { eventType, userId, startDate, endDate, page, limit } = queryResult.data!;

        // Build where clause
        const where: any = {};
        if (eventType) where.eventType = eventType;
        if (userId) where.userId = userId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const total = await prisma.auditLog.count({ where });

        const logs = await prisma.auditLog.findMany({
            where,
            skip: (page! - 1) * limit!,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return paginatedResponse(logs, total, page!, limit!);
    } catch (error) {
        return handleApiError(error, 'GET /api/audit-logs');
    }
}
