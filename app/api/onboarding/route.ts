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
import { onboardingSchema, bulkOnboardingSchema, employeeQuerySchema } from '@/lib/validation-schemas';
import { executeAutomatedOnboarding } from '@/lib/automated-workflows';
import { enqueueOnboarding } from '@/lib/job-queue';

// GET /api/onboarding - List onboarding records
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) return authResult.response;

        const queryResult = validateQueryParams(request, employeeQuerySchema);
        if (queryResult.error) return queryResult.response;

        const { page, limit } = queryResult.data!;

        const total = await prisma.onboardingRecord.count();

        const records = await prisma.onboardingRecord.findMany({
            skip: (page! - 1) * limit!,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                employee: true,
            },
        });

        return paginatedResponse(records, total, page!, limit!);
    } catch (error) {
        return handleApiError(error, 'GET /api/onboarding');
    }
}

// POST /api/onboarding - Initiate onboarding
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) return authResult.response;

        const validationResult = await validateRequest(request, onboardingSchema);
        if (validationResult.error) return validationResult.response;

        const { employeeId, source, initiatedBy } = validationResult.data!;

        // Check if employee exists
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
        });

        if (!employee) {
            return errorResponse('Employee not found', 404);
        }

        // Check if onboarding already exists
        const existingOnboarding = await prisma.onboardingRecord.findFirst({
            where: {
                employeeId,
                status: { in: ['PENDING', 'IN_PROGRESS'] },
            },
        });

        if (existingOnboarding) {
            return errorResponse('Onboarding already in progress for this employee', 409);
        }

        // Create onboarding record
        const onboardingRecord = await prisma.onboardingRecord.create({
            data: {
                employeeId,
                source,
                initiatedBy: initiatedBy || authResult.session.user?.email!,
                status: 'PENDING',
            },
            include: {
                employee: true,
            },
        });

        // Queue onboarding job
        const jobId = await enqueueOnboarding({
            employeeId: employee.id,
            email: employee.email,
            firstName: employee.firstName,
            lastName: employee.lastName,
            department: employee.department,
            jobTitle: employee.jobTitle,
            laptopRequired: employee.laptopRequired,
            laptopType: employee.laptopType,
            laptopConfig: employee.laptopConfig,
        });

        await logAuditEvent({
            eventType: 'ONBOARDING_INITIATED',
            action: 'CREATE',
            entityType: 'OnboardingRecord',
            entityId: onboardingRecord.id,
            userId: authResult.session.user?.email!,
            details: { employeeId: employee.id, jobId },
            request,
        });

        return successResponse({ onboardingRecord, jobId }, 201);
    } catch (error) {
        return handleApiError(error, 'POST /api/onboarding');
    }
}
