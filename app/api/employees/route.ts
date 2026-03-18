import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    requireAuth,
    validateRequest,
    validateQueryParams,
    handleApiError,
    logAuditEvent,
    successResponse,
    paginatedResponse,
} from '@/lib/api-middleware';
import { employeeSchema, employeeQuerySchema } from '@/lib/validation-schemas';

// GET /api/employees - List all employees with filtering and pagination
export async function GET(request: NextRequest) {
    let authResult: any;
    try {
        // Check authentication
        authResult = await requireAuth(request);
        if (authResult.error) return authResult.response;

        // Validate query parameters
        const queryResult = validateQueryParams(request, employeeQuerySchema);
        if (queryResult.error) return queryResult.response;

        const { status, department, search, page, limit } = queryResult.data!;

        // Build where clause
        const where: any = {};
        if (status) where.status = status;
        if (department) where.department = department;
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { employeeId: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get total count
        const total = await prisma.employee.count({ where });

        // Get paginated employees
        const employees = await prisma.employee.findMany({
            where,
            skip: (page! - 1) * limit!,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                onboardingRecords: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                offboardingRecords: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                assetAssignments: {
                    where: { status: 'ASSIGNED' },
                },
            },
        });

        await logAuditEvent({
            eventType: 'EMPLOYEE_LIST',
            action: 'LIST',
            entityType: 'Employee',
            userId: authResult.session.user?.email!,
            request,
        });

        return paginatedResponse(employees, total, page!, limit!);
    } catch (error) {
        return handleApiError(error, 'GET /api/employees');
    }
}

// POST /api/employees - Create a new employee
export async function POST(request: NextRequest) {
    let authResult: any;
    try {
        // Check authentication
        authResult = await requireAuth(request);
        if (authResult.error) return authResult.response;

        // Validate request body
        const validationResult = await validateRequest(request, employeeSchema);
        if (validationResult.error) return validationResult.response;

        const data = validationResult.data!;

        // Create employee
        const employee = await prisma.employee.create({
            data: {
                ...data,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : null,
            },
        });

        await logAuditEvent({
            eventType: 'EMPLOYEE_CREATED',
            action: 'CREATE',
            entityType: 'Employee',
            entityId: employee.id,
            userId: authResult.session.user?.email!,
            details: { employeeId: employee.employeeId, email: employee.email },
            request,
        });

        return successResponse(employee, 201);
    } catch (error) {
        await logAuditEvent({
            eventType: 'EMPLOYEE_CREATE_FAILED',
            action: 'CREATE',
            entityType: 'Employee',
            userId: authResult.session?.user?.email,
            request,
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });

        return handleApiError(error, 'POST /api/employees');
    }
}
