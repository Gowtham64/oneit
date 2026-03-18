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

    const results: Record<string, { success: boolean; message: string }> = {};

    // --- Google Workspace: createGoogleUser(email, fullName, orgUnitPath?) ---
    try {
      const { createGoogleUser } = await import('@/services/google');
      await createGoogleUser(email, `${firstName} ${lastName}`, `/${department}`);
      results.google = { success: true, message: `${email} created in Google Workspace` };
    } catch (e: any) {
      results.google = {
        success: false,
        message: e.message?.includes('not found') || e.message?.includes('credentials')
          ? 'Not configured — add GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_ADMIN_EMAIL to .env'
          : e.message
      };
    }

    // --- Okta: createOktaUser({ firstName, lastName, email, department }) ---
    try {
      const { createOktaUser } = await import('@/services/okta');
      await createOktaUser({ firstName, lastName, email, department });
      results.okta = { success: true, message: 'User activated in Okta' };
    } catch (e: any) {
      results.okta = {
        success: false,
        message: e.message?.includes('OKTA') || e.message?.includes('undefined')
          ? 'Not configured — add OKTA_API_TOKEN and OKTA_DOMAIN to .env'
          : e.message
      };
    }

    // --- Microsoft 365: createMicrosoftUser({ firstName, lastName, email, department, jobTitle }) ---
    try {
      const { createMicrosoftUser } = await import('@/services/microsoft');
      await createMicrosoftUser({ firstName, lastName, email, department, jobTitle });
      results.m365 = { success: true, message: 'M365 account provisioned' };
    } catch (e: any) {
      results.m365 = {
        success: false,
        message: e.message?.includes('AZURE') || e.message?.includes('CLIENT')
          ? 'Not configured — add AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID to .env'
          : e.message
      };
    }

    // --- Slack: inviteToSlack(email) ---
    try {
      const { inviteToSlack } = await import('@/services/slack');
      await inviteToSlack(personalEmail || email);
      results.slack = { success: true, message: 'Slack invite sent to personal email' };
    } catch (e: any) {
      results.slack = {
        success: false,
        message: e.message?.includes('SLACK') || e.message?.includes('token')
          ? 'Not configured — add SLACK_BOT_TOKEN to .env'
          : e.message
      };
    }

    // --- Snipe-IT: createSnipeItUser(firstName, lastName, email) ---
    try {
      const { createSnipeItUser } = await import('@/services/snipeit');
      await createSnipeItUser(firstName, lastName, email);
      results.snipeit = {
        success: true,
        message: `${laptopType || 'Device'} request created in Snipe-IT`
      };
    } catch (e: any) {
      results.snipeit = {
        success: false,
        message: e.message?.includes('SNIPEIT') || e.message?.includes('undefined')
          ? 'Not configured — add SNIPEIT_API_URL and SNIPEIT_API_KEY to .env'
          : e.message
      };
    }

    // --- MDM: JAMF for macOS, Scalefusion for Windows ---
    try {
      if (laptopOS === 'macOS' || !laptopOS) {
        const { getAvailableJAMFComputers } = await import('@/services/jamf');
        const available = await getAvailableJAMFComputers();
        if (available.length > 0) {
          const { assignJAMFComputer } = await import('@/services/jamf');
          await assignJAMFComputer(available[0].id, email, `${firstName} ${lastName}`);
          results.mdm = { success: true, message: `JAMF: ${available[0].name} assigned, enrollment triggered` };
        } else {
          results.mdm = { success: true, message: 'JAMF connected — no available Mac to assign right now' };
        }
      } else {
        const { getAvailableScalefusionDevices, assignScalefusionDevice } = await import('@/services/scalefusion');
        const sfDevices = await getAvailableScalefusionDevices();
        if (sfDevices.length > 0) {
          await assignScalefusionDevice(sfDevices[0].id, email, `${firstName} ${lastName}`);
          results.mdm = { success: true, message: `Scalefusion: ${sfDevices[0].name || 'Device'} assigned, enrollment sent` };
        } else {
          results.mdm = { success: true, message: 'Scalefusion connected — no available Windows device right now' };
        }
      }
    } catch (e: any) {
      results.mdm = {
        success: false,
        message: e.message?.includes('JAMF') || e.message?.includes('SCALEFUSION') || !process.env.JAMF_URL
          ? 'Not configured — add JAMF_URL/CLIENT_ID/SECRET or SCALEFUSION_API_KEY to .env'
          : e.message
      };
    }

    const successCount = Object.values(results).filter(r => r.success).length;
    const total = Object.keys(results).length;

    return NextResponse.json({
      success: successCount === total,
      partial: successCount > 0 && successCount < total,
      results,
      summary: `${successCount}/${total} integrations completed`,
    });
  } catch (error: any) {
    console.error('Onboarding trigger error:', error);
    return NextResponse.json({ error: 'Onboarding failed', message: error.message }, { status: 500 });
  }
}
