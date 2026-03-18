import { NextRequest, NextResponse } from 'next/server';

/**
 * Public endpoint to trigger full onboarding integration pipeline.
 * Uses server-side API keys from .env — no auth session required.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName, lastName, email, personalEmail, department,
      jobTitle, laptopType, laptopOS
    } = body;

    if (!firstName || !lastName || !email || !department || !jobTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // --- Database: Ensure Employee & Onboarding Record exist ---
    const { prisma } = await import('@/lib/prisma');
    let employee = await prisma.employee.upsert({
      where: { email },
      update: {
        firstName, lastName, personalEmail, department, jobTitle,
        status: 'ACTIVE',
      },
      create: {
        email, firstName, lastName, personalEmail, department, jobTitle,
        employeeId: `EMP-${Date.now()}`,
        location: 'Remote',
        employeeType: 'Full-Time',
        startDate: new Date(),
        status: 'ACTIVE',
        laptopRequired: !!laptopType,
        laptopType,
      }
    });

    const onboardRecord = await prisma.onboardingRecord.create({
      data: {
        employeeId: employee.id,
        status: 'IN_PROGRESS',
        source: 'Manual Trigger',
        initiatedBy: 'System Admin',
      }
    });

    const results: Record<string, { success: boolean; message: string }> = {};

    // Helper to log audit
    const logAction = async (action: string, success: boolean, msg: string) => {
      await prisma.auditLog.create({
        data: {
          eventType: 'ONBOARDING_ACTION',
          entityType: 'Employee',
          entityId: employee?.id,
          action,
          success,
          details: { message: msg },
        }
      });
    };

    // --- Google Workspace ---
    try {
      const { createGoogleUser } = await import('@/services/google');
      await createGoogleUser(email, `${firstName} ${lastName}`, `/${department}`);
      results.google = { success: true, message: `${email} created in Google` };
      await logAction('PROVISION_GOOGLE', true, results.google.message);
    } catch (e: any) {
      results.google = { success: false, message: e.message };
      await logAction('PROVISION_GOOGLE', false, e.message);
    }

    // --- Okta ---
    try {
      const { createOktaUser } = await import('@/services/okta');
      await createOktaUser(firstName, lastName, email);
      results.okta = { success: true, message: 'Activated in Okta' };
      await logAction('PROVISION_OKTA', true, results.okta.message);
    } catch (e: any) {
      results.okta = { success: false, message: e.message };
      await logAction('PROVISION_OKTA', false, e.message);
    }

    // --- Microsoft 365 ---
    try {
      const { createMicrosoftUser } = await import('@/services/microsoft');
      await createMicrosoftUser(firstName, lastName, email);
      results.m365 = { success: true, message: 'M365 account provisioned' };
      await logAction('PROVISION_M365', true, results.m365.message);
    } catch (e: any) {
      results.m365 = { success: false, message: e.message };
      await logAction('PROVISION_M365', false, e.message);
    }

    // --- Slack ---
    try {
      const { inviteToSlack } = await import('@/services/slack');
      await inviteToSlack(personalEmail || email);
      results.slack = { success: true, message: 'Slack invite sent' };
      await logAction('PROVISION_SLACK', true, results.slack.message);
    } catch (e: any) {
      results.slack = { success: false, message: e.message };
      await logAction('PROVISION_SLACK', false, e.message);
    }

    // --- Snipe-IT ---
    try {
      const { createSnipeItUser } = await import('@/services/snipeit');
      await createSnipeItUser(firstName, lastName, email);
      results.snipeit = { success: true, message: 'Snipe-IT user created' };
      await logAction('PROVISION_SNIPEIT', true, results.snipeit.message);
    } catch (e: any) {
      results.snipeit = { success: false, message: e.message };
      await logAction('PROVISION_SNIPEIT', false, e.message);
    }

    // --- MDM ---
    try {
      if (laptopOS === 'macOS' || !laptopOS) {
        const { getAvailableJAMFComputers, assignJAMFComputer } = await import('@/services/jamf');
        const available = await getAvailableJAMFComputers();
        if (available.length > 0) {
          await assignJAMFComputer(available[0].id, email, `${firstName} ${lastName}`);
          results.mdm = { success: true, message: `JAMF: ${available[0].name} assigned` };
        } else {
          results.mdm = { success: true, message: 'JAMF: Connected (No inventory)' };
        }
      } else {
        const { getAvailableScalefusionDevices, assignScalefusionDevice } = await import('@/services/scalefusion');
        const sfDevices = await getAvailableScalefusionDevices();
        if (sfDevices.length > 0) {
          await assignScalefusionDevice(sfDevices[0].id, email, `${firstName} ${lastName}`);
          results.mdm = { success: true, message: `Scalefusion: ${sfDevices[0].name} assigned` };
        } else {
          results.mdm = { success: true, message: 'Scalefusion: Connected (No inventory)' };
        }
      }
      await logAction('PROVISION_MDM', true, results.mdm.message);
    } catch (e: any) {
      results.mdm = { success: false, message: e.message };
      await logAction('PROVISION_MDM', false, e.message);
    }

    const successCount = Object.values(results).filter(r => r.success).length;
    const total = Object.keys(results).length;
    const allSuccessful = successCount === total;

    // --- Update Onboarding Record ---
    await prisma.onboardingRecord.update({
      where: { id: onboardRecord.id },
      data: {
        status: allSuccessful ? 'COMPLETED' : 'PARTIAL',
        completedAt: allSuccessful ? new Date() : null,
        errors: allSuccessful ? undefined : results,
        googleCreated: results.google?.success || false,
        slackAdded: results.slack?.success || false,
        oktaCreated: results.okta?.success || false,
        microsoftCreated: results.m365?.success || false,
        snipeitCreated: results.snipeit?.success || false,
      }
    });

    return NextResponse.json({
      success: allSuccessful,
      partial: successCount > 0 && !allSuccessful,
      results,
      summary: `${successCount}/${total} integrations completed`,
    });
  } catch (error: any) {
    console.error('Onboarding trigger error:', error);
    return NextResponse.json({ error: 'Onboarding failed', message: error.message }, { status: 500 });
  }
}
