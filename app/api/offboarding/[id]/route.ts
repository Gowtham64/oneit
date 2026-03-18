import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    requireAuth,
    handleApiError,
    successResponse,
    errorResponse,
} from '@/lib/api-middleware';

// GET /api/offboarding/[id] - Get offboarding status
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) return authResult.response;

        const offboardingRecord = await prisma.offboardingRecord.findUnique({
            where: { id: params.id },
            include: {
                employee: true,
            },
        });

        if (!offboardingRecord) {
            return errorResponse('Offboarding record not found', 404);
        }

        return successResponse(offboardingRecord);
    } catch (error) {
        return handleApiError(error, `GET /api/offboarding/${params.id}`);
    }
}
