import { getUserAssets, createJiraTicket } from '@/services/snipeit';
import { sendITLaptopCollectionEmail } from '@/lib/email';

export async function handleOffboardingWithAssetCheck(
    employeeEmail: string,
    employeeName: string,
    collectionAddress?: string
) {
    try {
        // Check Snipe-IT for assets
        const assetCheck = await getUserAssets(employeeEmail);

        if (assetCheck.hasAssets && assetCheck.assets.length > 0) {
            // User has assets - create Jira ticket and/or send email
            const results = {
                hasAssets: true,
                assetCount: assetCheck.assets.length,
                assets: assetCheck.assets,
                jiraTicket: null as any,
                emailSent: false,
                shouldProceedWithOffboarding: false,
            };

            // Try to create Jira ticket
            const jiraResult = await createJiraTicket(
                employeeEmail,
                employeeName,
                assetCheck.assets,
                collectionAddress
            );

            if (jiraResult.success) {
                results.jiraTicket = {
                    key: jiraResult.ticketKey,
                    url: jiraResult.ticketUrl,
                };
            }

            // Send email notification to IT
            if (collectionAddress) {
                const emailResult = await sendITLaptopCollectionEmail(
                    employeeEmail,
                    collectionAddress,
                    employeeName
                );
                results.emailSent = emailResult.success;
            }

            return results;
        } else {
            // No assets found - proceed with offboarding
            return {
                hasAssets: false,
                assetCount: 0,
                assets: [],
                shouldProceedWithOffboarding: true,
            };
        }
    } catch (error) {
        console.error('Error in asset check:', error);
        throw error;
    }
}
