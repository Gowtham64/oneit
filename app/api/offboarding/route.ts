import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    requireAuth,
    validateRequest,
    handleApiError,
    logAuditEvent,
    successResponse,
    errorResponse,
    paginatedResponse,
} from '@/lib/api-middleware';
import { offboardingSchema, employeeQuerySchema } from '@/lib/validation-schemas';
import { executeAutomatedOffboarding } from '@/lib/automated-workflows';
import { enqueueOffboarding } from '@/lib/job-queue';

// GET /api/offboarding - List offboarding records
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) return authResult.response;

        const queryResult = validateQueryParams(request, employeeQuerySchema);
        if (queryResult.error) return queryResult.response;

        const { page, limit } = queryResult.data!;

        const total = await prisma.offboardingRecord.count();

        const records = await prisma.offboardingRecord.findMany({
            skip: (page! - 1) * limit!,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                employee: true,
            },
        });

        return paginatedResponse(records, total, page!, limit!);
    } catch (error) {
        return handleApiError(error, 'GET /api/offboarding');
    }
}

// POST /api/offboarding - Initiate offboarding
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) return authResult.response;

        const validationResult = await validateRequest(request, offboardingSchema);
        if (validationResult.error) return validationResult.response;

        const { employeeId, source, collectionAddress, initiatedBy } = validationResult.data!;

        // Check if employee exists
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
        });

        if (!employee) {
            return errorResponse('Employee not found', 404);
        }

        // Check if offboarding already exists
        const existingOffboarding = await prisma.offboardingRecord.findFirst({
            where: {
                employeeId,
                status: { in: ['PENDING', 'IN_PROGRESS', 'ASSET_COLLECTION'] },
            },
        });

        if (existingOffboarding) {
            return errorResponse('Offboarding already in progress for this employee', 409);
        }

        // Create offboarding record
        const offboardingRecord = await prisma.offboardingRecord.create({
            data: {
                employeeId,
                source,
                collectionAddress,
                initiatedBy: initiatedBy || authResult.session.user?.email!,
                status: 'PENDING',
            },
            include: {
                employee: true,
            },
        });

        // Update employee status
        await prisma.employee.update({
            where: { id: employeeId },
            data: { status: 'OFFBOARDING' },
        });

        // Queue offboarding job
        const jobId = await enqueueOffboarding({
            employeeId: employee.id,
            email: employee.email,
            firstName: employee.firstName,
            lastName: employee.lastName,
            collectionAddress,
        });

        await logAuditEvent({
            eventType: 'OFFBOARDING_INITIATED',
            action: 'CREATE',
            entityType: 'OffboardingRecord',
            entityId: offboardingRecord.id,
            userId: authResult.session.user?.email!,
            details: { employeeId: employee.id, jobId },
            request,
        });

        return successResponse({ offboardingRecord, jobId }, 201);
    } catch (error) {
        return handleApiError(error, 'POST /api/offboarding');
    }
}
