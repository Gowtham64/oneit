import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const HRMS_WEBHOOK_SECRET = process.env.HRMS_WEBHOOK_SECRET;
const HRMS_AUTO_PROVISION = process.env.HRMS_AUTO_PROVISION === 'true';

/**
 * Verify HMAC signature from HRMS webhook
 */
function verifySignature(payload: string, signature: string): boolean {
    if (!HRMS_WEBHOOK_SECRET) {
        console.warn('HRMS_WEBHOOK_SECRET not configured');
        return false;
    }

    const hmac = crypto.createHmac('sha256', HRMS_WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
    );
}

/**
 * POST /api/webhooks/hrms
 * Receives webhook events from HRMS platforms
 */
export async function POST(request: NextRequest) {
    try {
        // Get raw body for signature verification
        const rawBody = await request.text();
        const signature = request.headers.get('x-hrms-signature') || '';

        // Verify webhook signature
        if (!verifySignature(rawBody, signature)) {
            console.error('Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Parse webhook payload
        const payload = JSON.parse(rawBody);
        const { event, employee } = payload;

        console.log(`Received HRMS webhook: ${event}`, employee);

        // Check if auto-provisioning is enabled
        if (!HRMS_AUTO_PROVISION) {
            console.log('Auto-provisioning disabled, ignoring webhook');
            return NextResponse.json({
                status: 'ignored',
                message: 'Auto-provisioning is disabled'
            });
        }

        // Validate required fields
        if (!employee?.email || !employee?.firstName || !employee?.lastName) {
            return NextResponse.json(
                { error: 'Missing required employee fields' },
                { status: 400 }
            );
        }

        // Handle different event types
        switch (event) {
            case 'employee.hired':
            case 'employee.created':
                await handleOnboarding(employee);
                break;

            case 'employee.terminated':
            case 'employee.offboarded':
                await handleOffboarding(employee);
                break;

            case 'employee.updated':
                console.log('Employee update event - not implemented yet');
                break;

            default:
                console.log(`Unknown event type: ${event}`);
        }

        return NextResponse.json({
            status: 'success',
            event,
            employeeEmail: employee.email
        });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle employee onboarding from HRMS
 */
async function handleOnboarding(employee: any) {
    const { enqueueOnboarding } = await import('@/lib/job-queue');

    // Transform HRMS data to OneIT format
    const employeeData = {
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        personalEmail: employee.personalEmail,
        phone: employee.phone,
        department: employee.department,
        jobTitle: employee.jobTitle,
        manager: employee.manager,
        startDate: employee.startDate,
        employeeId: employee.id,
        location: employee.location,
        // Laptop configuration from custom fields
        laptopRequired: employee.customFields?.laptopRequired === 'Yes',
        laptopType: employee.customFields?.laptopType,
        laptopConfig: employee.customFields?.laptopConfig,
        source: 'HRMS',
        timestamp: new Date().toISOString(),
    };

    // Queue onboarding job
    await enqueueOnboarding(employeeData);

    console.log(`Onboarding queued for ${employee.email}`);
}

/**
 * Handle employee offboarding from HRMS
 */
async function handleOffboarding(employee: any) {
    const { enqueueOffboarding } = await import('@/lib/job-queue');

    const employeeData = {
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeId: employee.id,
        department: employee.department,
        terminationDate: employee.terminationDate || new Date().toISOString(),
        source: 'HRMS',
        timestamp: new Date().toISOString(),
    };

    // Queue offboarding job
    await enqueueOffboarding(employeeData);

    console.log(`Offboarding queued for ${employee.email}`);
}

/**
 * GET /api/webhooks/hrms
 * Returns webhook configuration info
 */
export async function GET() {
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/hrms`
        : 'https://your-domain.com/api/webhooks/hrms';

    return NextResponse.json({
        webhookUrl,
        autoProvisionEnabled: HRMS_AUTO_PROVISION,
        secretConfigured: !!HRMS_WEBHOOK_SECRET,
        supportedEvents: [
            'employee.hired',
            'employee.created',
            'employee.terminated',
            'employee.offboarded',
            'employee.updated'
        ]
    });
}
