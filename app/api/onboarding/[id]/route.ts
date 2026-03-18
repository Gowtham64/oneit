import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    requireAuth,
    handleApiError,
    successResponse,
    errorResponse,
} from '@/lib/api-middleware';

// GET /api/onboarding/[id] - Get onboarding status
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) return authResult.response;

        const onboardingRecord = await prisma.onboardingRecord.findUnique({
            where: { id: params.id },
            include: {
                employee: true,
            },
        });

        if (!onboardingRecord) {
            return errorResponse('Onboarding record not found', 404);
        }

        return successResponse(onboardingRecord);
    } catch (error) {
        return handleApiError(error, `GET /api/onboarding/${params.id}`);
    }
}
