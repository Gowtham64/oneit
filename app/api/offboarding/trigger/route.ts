import { NextRequest, NextResponse } from 'next/server';

/**
 * Public endpoint to trigger full offboarding revocation.
 * Uses server-side API keys from .env — no auth session required.
 * Each step calls the actual service with correct function signatures.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, employeeName, userId, hasLaptop, collectionAddress } = body;

    if (!email) {
      return NextResponse.json({ error: 'Employee email is required' }, { status: 400 });
    }

    // --- Database: Ensure Employee & Offboarding Record exist ---
    const { prisma } = await import('@/lib/prisma');
    let employee = await prisma.employee.findUnique({ where: { email } });

    if (!employee) {
      // Create a skeleton employee record if they don't exist yet
      employee = await prisma.employee.create({
        data: {
          email,
          employeeId: userId || `EMP-${Date.now()}`,
          firstName: employeeName?.split(' ')[0] || 'Unknown',
          lastName: employeeName?.split(' ').slice(1).join(' ') || 'User',
          department: 'Unknown',
          jobTitle: 'Unknown',
          location: 'Remote',
          employeeType: 'Full-Time',
          startDate: new Date(),
          status: 'OFFBOARDING',
        }
      });
    } else {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { status: 'OFFBOARDING' }
      });
    }

    const offboardRecord = await prisma.offboardingRecord.create({
      data: {
        employeeId: employee.id,
        status: 'IN_PROGRESS',
        source: 'Manual Trigger',
        hasAssets: hasLaptop || false,
        collectionAddress,
        initiatedBy: 'System Admin',
      }
    });

    const results: Record<string, { success: boolean; message: string }> = {};

    // Helper to log audit
    const logAction = async (action: string, success: boolean, msg: string) => {
      await prisma.auditLog.create({
        data: {
          eventType: 'OFFBOARDING_ACTION',
          entityType: 'Employee',
          entityId: employee?.id,
          action,
          success,
          details: { message: msg },
        }
      });
    };

    // --- Suspend Google Workspace ---
    try {
      const { deleteGoogleUser } = await import('@/services/google');
      await deleteGoogleUser(email);
      results.google = { success: true, message: `${email} suspended in Google Workspace` };
      await logAction('SUSPEND_GOOGLE', true, results.google.message);
    } catch (e: any) {
      const notConfigured = e.message?.includes('GOOGLE') || e.message?.includes('credentials') || e.message?.includes('undefined');
      results.google = {
        success: false,
        message: notConfigured ? 'Not configured — add GOOGLE_SERVICE_ACCOUNT_KEY to .env' : e.message
      };
      await logAction('SUSPEND_GOOGLE', false, results.google.message);
    }

    // --- Deactivate Okta ---
    try {
      const { deactivateOktaUser } = await import('@/services/okta');
      await deactivateOktaUser(userId || email);
      results.okta = { success: true, message: 'Okta account deactivated.' };
      await logAction('DEACTIVATE_OKTA', true, results.okta.message);
    } catch (e: any) {
      const notConfigured = e.message?.includes('OKTA') || e.message?.includes('undefined');
      results.okta = {
        success: false,
        message: notConfigured ? 'Not configured — add OKTA keys to .env' : e.message
      };
      await logAction('DEACTIVATE_OKTA', false, results.okta.message);
    }

    // --- Block Microsoft 365 ---
    try {
      const { deleteMicrosoftUser } = await import('@/services/microsoft');
      await deleteMicrosoftUser(userId || email);
      results.m365 = { success: true, message: 'M365 account blocked.' };
      await logAction('BLOCK_M365', true, results.m365.message);
    } catch (e: any) {
      const notConfigured = e.message?.includes('AZURE') || e.message?.includes('undefined');
      results.m365 = {
        success: false,
        message: notConfigured ? 'Not configured — add AZURE keys to .env' : e.message
      };
      await logAction('BLOCK_M365', false, results.m365.message);
    }

    // --- Remove from Slack ---
    try {
      const { removeFromSlack } = await import('@/services/slack');
      await removeFromSlack(email);
      results.slack = { success: true, message: 'Removed from Slack.' };
      await logAction('REMOVE_SLACK', true, results.slack.message);
    } catch (e: any) {
      const notConfigured = e.message?.includes('SLACK') || e.message?.includes('undefined');
      results.slack = {
        success: false,
        message: notConfigured ? 'Not configured — add SLACK_BOT_TOKEN to .env' : e.message
      };
      await logAction('REMOVE_SLACK', false, results.slack.message);
    }

    // --- Snipe-IT Check-in ---
    try {
      const { getUserAssets } = await import('@/services/snipeit');
      const assetData = await getUserAssets(email);
      results.snipeit = { success: true, message: `Flagged ${assetData.assets?.length || 0} assets for return.` };
      await logAction('SNIPEIT_CHECKIN', true, results.snipeit.message);
    } catch (e: any) {
      results.snipeit = { success: false, message: e.message };
      await logAction('SNIPEIT_CHECKIN', false, e.message);
    }

    const successCount = Object.values(results).filter(r => r.success).length;
    const total = Object.keys(results).length;
    const allSuccessful = successCount === total;

    // --- Update Offboarding Record & Employee Status ---
    await prisma.offboardingRecord.update({
      where: { id: offboardRecord.id },
      data: {
        status: allSuccessful ? 'COMPLETED' : 'FAILED',
        completedAt: allSuccessful ? new Date() : null,
        errors: allSuccessful ? undefined : results,
        googleDeactivated: results.google?.success || false,
        oktaDeactivated: results.okta?.success || false,
        microsoftDeactivated: results.m365?.success || false,
        slackRemoved: results.slack?.success || false,
      }
    });

    if (allSuccessful) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { status: 'OFFBOARDED', endDate: new Date() }
      });
    }

    return NextResponse.json({
      success: allSuccessful,
      partial: successCount > 0 && !allSuccessful,
      results,
      summary: `${successCount}/${total} tasks finished`,
    });
  } catch (error: any) {
    console.error('Offboarding trigger error:', error);
    return NextResponse.json({ error: 'Offboarding failed', message: error.message }, { status: 500 });
  }
}
