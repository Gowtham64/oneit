import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    requireAdminOrSuperAdmin,
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
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const authResult = await requireAdminOrSuperAdmin(request);
        if (authResult.error) return authResult.response;

        const validationResult = await validateRequest(request, integrationConfigSchema.partial());
        if (validationResult.error) return validationResult.response;

        const data = validationResult.data!;

        const integration = await prisma.integration.update({
            where: { id },
            data,
        });

        await logAuditEvent({
            eventType: 'INTEGRATION_UPDATED',
            action: 'UPDATE',
            entityType: 'Integration',
            entityId: integration.id,
            userId: authResult.session.user?.email!,
            details: { changes: data },
            request,
        });

        return successResponse(integration);
    } catch (error) {
        return handleApiError(error, `PUT /api/integrations/${id}`);
    }
}
