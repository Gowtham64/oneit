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
import { updateEmployeeSchema } from '@/lib/validation-schemas';

// GET /api/employees/[id] - Get employee by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const authResult = await requireAdminOrSuperAdmin(request);
        if (authResult.error) return authResult.response;

        const employee = await prisma.employee.findUnique({
            where: { id },
            include: {
                onboardingRecords: {
                    orderBy: { createdAt: 'desc' },
                },
                offboardingRecords: {
                    orderBy: { createdAt: 'desc' },
                },
                assetAssignments: true,
            },
        });

        if (!employee) {
            return errorResponse('Employee not found', 404);
        }

        await logAuditEvent({
            eventType: 'EMPLOYEE_VIEWED',
            action: 'VIEW',
            entityType: 'Employee',
            entityId: employee.id,
            userId: authResult.session.user?.email!,
            request,
        });

        return successResponse(employee);
    } catch (error) {
        return handleApiError(error, `GET /api/employees/${id}`);
    }
}

// PUT /api/employees/[id] - Update employee
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const authResult = await requireAdminOrSuperAdmin(request);
        if (authResult.error) return authResult.response;

        const validationResult = await validateRequest(request, updateEmployeeSchema);
        if (validationResult.error) return validationResult.response;

        const data = validationResult.data!;

        // Check if employee exists
        const existingEmployee = await prisma.employee.findUnique({
            where: { id },
        });

        if (!existingEmployee) {
            return errorResponse('Employee not found', 404);
        }

        // Update employee
        const employee = await prisma.employee.update({
            where: { id },
            data: {
                ...data,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
            },
        });

        await logAuditEvent({
            eventType: 'EMPLOYEE_UPDATED',
            action: 'UPDATE',
            entityType: 'Employee',
            entityId: employee.id,
            userId: authResult.session.user?.email!,
            details: { changes: data },
            request,
        });

        return successResponse(employee);
    } catch (error) {
        return handleApiError(error, `PUT /api/employees/${id}`);
    }
}

// DELETE /api/employees/[id] - Soft delete employee
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const authResult = await requireAdminOrSuperAdmin(request);
        if (authResult.error) return authResult.response;

        // Check if employee exists
        const existingEmployee = await prisma.employee.findUnique({
            where: { id },
        });

        if (!existingEmployee) {
            return errorResponse('Employee not found', 404);
        }

        // Soft delete by setting status to OFFBOARDED
        const employee = await prisma.employee.update({
            where: { id },
            data: { status: 'OFFBOARDED' },
        });

        await logAuditEvent({
            eventType: 'EMPLOYEE_DELETED',
            action: 'DELETE',
            entityType: 'Employee',
            entityId: employee.id,
            userId: authResult.session.user?.email!,
            details: { employeeId: employee.employeeId, email: employee.email },
            request,
        });

        return successResponse({ message: 'Employee deleted successfully', employee });
    } catch (error) {
        return handleApiError(error, `DELETE /api/employees/${id}`);
    }
}
