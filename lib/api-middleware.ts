import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ZodSchema } from 'zod';
import { prisma } from '@/lib/prisma';

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

export async function requireAuth(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return {
            error: true,
            response: NextResponse.json(
                { error: 'Unauthorized', message: 'You must be logged in to access this resource' },
                { status: 401 }
            ),
        };
    }

    return { error: false, session };
}

export async function requireRole(request: NextRequest, requiredRole: 'ADMIN' | 'USER') {
    const authResult = await requireAuth(request);

    if (authResult.error) {
        return authResult;
    }

    const user = await prisma.user.findUnique({
        where: { email: authResult.session.user?.email! },
        select: { role: true },
    });

    if (!user || user.role !== requiredRole) {
        return {
            error: true,
            response: NextResponse.json(
                { error: 'Forbidden', message: 'You do not have permission to access this resource' },
                { status: 403 }
            ),
        };
    }

    return { error: false, session: authResult.session, user };
}

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

export async function validateRequest<T>(
    request: NextRequest,
    schema: ZodSchema<T>
): Promise<{ error: boolean; data?: T; response?: NextResponse }> {
    try {
        const body = await request.json();
        const validatedData = schema.parse(body);

        return { error: false, data: validatedData };
    } catch (error: any) {
        return {
            error: true,
            response: NextResponse.json(
                {
                    error: 'Validation Error',
                    message: 'Invalid request data',
                    details: error.errors || error.message,
                },
                { status: 400 }
            ),
        };
    }
}

export function validateQueryParams<T>(
    request: NextRequest,
    schema: ZodSchema<T>
): { error: boolean; data?: T; response?: NextResponse } {
    try {
        const { searchParams } = new URL(request.url);
        const params = Object.fromEntries(searchParams.entries());
        const validatedData = schema.parse(params);

        return { error: false, data: validatedData };
    } catch (error: any) {
        return {
            error: true,
            response: NextResponse.json(
                {
                    error: 'Validation Error',
                    message: 'Invalid query parameters',
                    details: error.errors || error.message,
                },
                { status: 400 }
            ),
        };
    }
}

// ============================================
// ERROR HANDLING
// ============================================

export function handleApiError(error: any, context?: string) {
    console.error(`API Error ${context ? `in ${context}` : ''}:`, error);

    // Prisma errors
    if (error.code === 'P2002') {
        return NextResponse.json(
            { error: 'Conflict', message: 'A record with this unique field already exists' },
            { status: 409 }
        );
    }

    if (error.code === 'P2025') {
        return NextResponse.json(
            { error: 'Not Found', message: 'The requested record was not found' },
            { status: 404 }
        );
    }

    // Generic error
    return NextResponse.json(
        {
            error: 'Internal Server Error',
            message: error.message || 'An unexpected error occurred',
        },
        { status: 500 }
    );
}

// ============================================
// AUDIT LOGGING
// ============================================

export async function logAuditEvent({
    eventType,
    action,
    entityType,
    entityId,
    userId,
    details,
    request,
    success = true,
    errorMessage,
}: {
    eventType: string;
    action: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    details?: any;
    request?: NextRequest;
    success?: boolean;
    errorMessage?: string;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                eventType,
                action,
                entityType,
                entityId,
                userId,
                details: details ? JSON.parse(JSON.stringify(details)) : null,
                ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown',
                userAgent: request?.headers.get('user-agent') || 'unknown',
                success,
                errorMessage,
            },
        });
    } catch (error) {
        console.error('Failed to log audit event:', error);
    }
}

// ============================================
// RESPONSE HELPERS
// ============================================

export function successResponse<T>(data: T, status: number = 200) {
    return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status: number = 400, details?: any) {
    return NextResponse.json(
        { success: false, error: message, details },
        { status }
    );
}

export function paginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
) {
    return NextResponse.json({
        success: true,
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
        },
    });
}
