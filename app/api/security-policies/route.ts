import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    requireAuth,
    requireRole,
    validateRequest,
    handleApiError,
    logAuditEvent,
    successResponse,
} from '@/lib/api-middleware';
import { securityPolicySchema } from '@/lib/validation-schemas';

// GET /api/security-policies - Get current security policies
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) return authResult.response;

        // Get the first (and should be only) security policy record
        let policy = await prisma.securityPolicy.findFirst();

        // If no policy exists, create default one
        if (!policy) {
            policy = await prisma.securityPolicy.create({
                data: {
                    mfaRequired: true,
                    passwordMinLength: 12,
                    passwordRequireUpper: true,
                    passwordRequireLower: true,
                    passwordRequireNumber: true,
                    passwordRequireSpecial: true,
                    sessionTimeoutMinutes: 30,
                    ipWhitelistEnabled: false,
                    auditLoggingEnabled: true,
                },
            });
        }

        return successResponse(policy);
    } catch (error) {
        return handleApiError(error, 'GET /api/security-policies');
    }
}

// PUT /api/security-policies - Update security policies
export async function PUT(request: NextRequest) {
    try {
        const roleResult = await requireRole(request, 'ADMIN');
        if (roleResult.error) return roleResult.response;

        const validationResult = await validateRequest(request, securityPolicySchema);
        if (validationResult.error) return validationResult.response;

        const data = validationResult.data!;

        // Get existing policy or create new one
        let policy = await prisma.securityPolicy.findFirst();

        if (policy) {
            policy = await prisma.securityPolicy.update({
                where: { id: policy.id },
                data: {
                    ...data,
                    updatedBy: roleResult.session.user?.email!,
                },
            });
        } else {
            policy = await prisma.securityPolicy.create({
                data: {
                    ...data,
                    updatedBy: roleResult.session.user?.email!,
                },
            });
        }

        await logAuditEvent({
            eventType: 'SECURITY_POLICY_UPDATED',
            action: 'UPDATE',
            entityType: 'SecurityPolicy',
            entityId: policy.id,
            userId: roleResult.session.user?.email!,
            details: { changes: data },
            request,
        });

        return successResponse(policy);
    } catch (error) {
        return handleApiError(error, 'PUT /api/security-policies');
    }
}
