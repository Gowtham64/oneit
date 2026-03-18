import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    requireRole,
    validateRequest,
    handleApiError,
    logAuditEvent,
    successResponse,
    errorResponse,
} from '@/lib/api-middleware';
import { integrationConfigSchema } from '@/lib/validation-schemas';

// PUT /api/integrations/[id] - Update integration config
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const roleResult = await requireRole(request, 'ADMIN');
        if (roleResult.error) return roleResult.response;

        const validationResult = await validateRequest(request, integrationConfigSchema.partial());
        if (validationResult.error) return validationResult.response;

        const data = validationResult.data!;

        const integration = await prisma.integration.update({
            where: { id: params.id },
            data,
        });

        await logAuditEvent({
            eventType: 'INTEGRATION_UPDATED',
            action: 'UPDATE',
            entityType: 'Integration',
            entityId: integration.id,
            userId: roleResult.session.user?.email!,
            details: { changes: data },
            request,
        });

        return successResponse(integration);
    } catch (error) {
        return handleApiError(error, `PUT /api/integrations/${params.id}`);
    }
}
