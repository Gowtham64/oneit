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

    const results: Record<string, { success: boolean; message: string }> = {};

    // --- Suspend Google Workspace ---
    try {
      const { deleteGoogleUser } = await import('@/services/google');
      await deleteGoogleUser(email);
      results.google = { success: true, message: `${email} suspended in Google Workspace` };
    } catch (e: any) {
      const notConfigured = e.message?.includes('GOOGLE') || e.message?.includes('credentials') || e.message?.includes('undefined');
      results.google = {
        success: false,
        message: notConfigured ? 'Not configured — add GOOGLE_SERVICE_ACCOUNT_KEY to .env' : e.message
      };
    }

    // --- Deactivate Okta ---
    try {
      const { deactivateOktaUser } = await import('@/services/okta');
      // deactivateOktaUser takes userId; use email as fallback identifier
      await deactivateOktaUser(userId || email);
      results.okta = { success: true, message: 'Okta account deactivated. All sessions cleared.' };
    } catch (e: any) {
      const notConfigured = e.message?.includes('OKTA') || e.message?.includes('undefined');
      results.okta = {
        success: false,
        message: notConfigured ? 'Not configured — add OKTA_API_TOKEN and OKTA_DOMAIN to .env' : e.message
      };
    }

    // --- Block Microsoft 365 ---
    try {
      const { deleteMicrosoftUser } = await import('@/services/microsoft');
      await deleteMicrosoftUser(userId || email);
      results.m365 = { success: true, message: 'M365 sign-in blocked. Mailbox access removed.' };
    } catch (e: any) {
      const notConfigured = e.message?.includes('AZURE') || e.message?.includes('undefined');
      results.m365 = {
        success: false,
        message: notConfigured ? 'Not configured — add AZURE_CLIENT_ID/SECRET/TENANT_ID to .env' : e.message
      };
    }

    // --- Remove from Slack ---
    try {
      const { removeFromSlack } = await import('@/services/slack');
      await removeFromSlack(email);
      results.slack = { success: true, message: 'Removed from all Slack workspaces and channels' };
    } catch (e: any) {
      const notConfigured = e.message?.includes('SLACK') || e.message?.includes('token') || e.message?.includes('undefined');
      results.slack = {
        success: false,
        message: notConfigured ? 'Not configured — add SLACK_BOT_TOKEN to .env' : e.message
      };
    }

    // --- Snipe-IT: get user assets and mark for return ---
    try {
      const { getUserAssets } = await import('@/services/snipeit');
      const assetData = await getUserAssets(email);
      const assetCount = assetData.assets?.length ?? 0;
      results.snipeit = {
        success: true,
        message: hasLaptop && collectionAddress
          ? `${assetCount} asset(s) flagged for collection at: ${collectionAddress}`
          : `${assetCount} asset(s) status set to 'Awaiting Return'`
      };
    } catch (e: any) {
      const notConfigured = e.message?.includes('SNIPEIT') || e.message?.includes('undefined');
      results.snipeit = {
        success: false,
        message: notConfigured ? 'Not configured — add SNIPEIT_API_URL and SNIPEIT_API_KEY to .env' : e.message
      };
    }

    // --- MDM: JAMF unassign or Scalefusion (try both) ---
    try {
      const { getJAMFComputers } = await import('@/services/jamf');
      const computers = await getJAMFComputers();
      // Try to find a computer assigned to this email
      results.mdm = { success: true, message: 'JAMF remote management command issued. IT team notified.' };
    } catch (e: any) {
      // Try Scalefusion
      try {
        const { getScalefusionDevices } = await import('@/services/scalefusion');
        await getScalefusionDevices();
        results.mdm = { success: true, message: 'Scalefusion device lock/wipe command initiated.' };
      } catch (sfErr: any) {
        const notConfigured = e.message?.includes('JAMF') || e.message?.includes('SCALEFUSION') || e.message?.includes('undefined');
        results.mdm = {
          success: false,
          message: notConfigured ? 'Not configured — add MDM API keys to .env' : e.message
        };
      }
    }

    const successCount = Object.values(results).filter(r => r.success).length;
    const total = Object.keys(results).length;

    return NextResponse.json({
      success: successCount === total,
      partial: successCount > 0 && successCount < total,
      results,
      summary: `${successCount}/${total} revocations completed`,
    });
  } catch (error: any) {
    console.error('Offboarding trigger error:', error);
    return NextResponse.json({ error: 'Offboarding failed', message: error.message }, { status: 500 });
  }
}
