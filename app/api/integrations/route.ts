import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    requireAuth,
    requireRole,
    validateRequest,
    handleApiError,
    logAuditEvent,
    successResponse,
    errorResponse,
} from '@/lib/api-middleware';
import { integrationConfigSchema } from '@/lib/validation-schemas';

// GET /api/integrations - List all integrations
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) return authResult.response;

        const integrations = await prisma.integration.findMany({
            orderBy: { name: 'asc' },
        });

        return successResponse(integrations);
    } catch (error) {
        return handleApiError(error, 'GET /api/integrations');
    }
}

// POST /api/integrations - Create new integration
export async function POST(request: NextRequest) {
    try {
        const roleResult = await requireRole(request, 'ADMIN');
        if (roleResult.error) return roleResult.response;

        const validationResult = await validateRequest(request, integrationConfigSchema);
        if (validationResult.error) return validationResult.response;

        const data = validationResult.data!;

        const integration = await prisma.integration.create({
            data,
        });

        await logAuditEvent({
            eventType: 'INTEGRATION_CREATED',
            action: 'CREATE',
            entityType: 'Integration',
            entityId: integration.id,
            userId: roleResult.session.user?.email!,
            details: { name: integration.name, type: integration.type },
            request,
        });

        return successResponse(integration, 201);
    } catch (error) {
        return handleApiError(error, 'POST /api/integrations');
    }
}
