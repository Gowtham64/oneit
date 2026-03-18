/**
 * Automated workflows for HRMS-triggered onboarding and offboarding
 */

import { logAuditEvent } from './audit-log';

/**
 * Execute automated onboarding workflow
 */
export async function executeAutomatedOnboarding(employeeData: any) {
    const results = {
        employee: employeeData.email,
        steps: [] as any[],
        success: true,
        errors: [] as string[],
    };

    try {
        console.log(`Starting automated onboarding for ${employeeData.email}`);

        // Step 1: Create Google Workspace account
        try {
            const { createGoogleUser } = await import('@/services/google');
            const googleOrgUnit = employeeData.googleOrgUnit || '/';
            await createGoogleUser(
                employeeData.email,
                `${employeeData.firstName} ${employeeData.lastName}`,
                googleOrgUnit
            );
            results.steps.push({
                service: 'Google Workspace',
                status: 'success',
                orgUnit: googleOrgUnit
            });
        } catch (error: any) {
            results.errors.push(`Google: ${error.message}`);
            results.steps.push({ service: 'Google Workspace', status: 'failed', error: error.message });
        }

        // Step 2: Add to Slack
        try {
            const { inviteToSlack, addToSlackChannels } = await import('@/services/slack');
            const slackMemberType = employeeData.slackMemberType || 'MEMBER';
            const slackChannels = employeeData.slackChannels || [];

            // Invite user based on member type
            if (slackMemberType === 'MEMBER') {
                await inviteToSlack(employeeData.email);
                results.steps.push({
                    service: 'Slack',
                    status: 'success',
                    memberType: 'Full Member'
                });
            } else {
                // For guest users, invite to specific channels
                await addToSlackChannels(
                    employeeData.email,
                    slackChannels,
                    slackMemberType === 'SINGLE_CHANNEL' ? 'single_channel_guest' : 'multi_channel_guest'
                );
                results.steps.push({
                    service: 'Slack',
                    status: 'success',
                    memberType: slackMemberType === 'SINGLE_CHANNEL' ? 'Single Channel Guest' : 'Multi-Channel Guest',
                    channels: slackChannels
                });
            }
        } catch (error: any) {
            results.errors.push(`Slack: ${error.message}`);
            results.steps.push({ service: 'Slack', status: 'failed', error: error.message });
        }

        // Step 3: Create Okta account
        try {
            const { createOktaUser } = await import('@/services/okta');
            await createOktaUser({
                email: employeeData.email,
                firstName: employeeData.firstName,
                lastName: employeeData.lastName,
            });
            results.steps.push({ service: 'Okta', status: 'success' });
        } catch (error: any) {
            results.errors.push(`Okta: ${error.message}`);
            results.steps.push({ service: 'Okta', status: 'failed', error: error.message });
        }

        // Step 4: Create Microsoft 365 account
        try {
            const { createMicrosoftUser } = await import('@/services/microsoft');
            await createMicrosoftUser(
                employeeData.email,
                `${employeeData.firstName} ${employeeData.lastName}`
            );
            results.steps.push({ service: 'Microsoft 365', status: 'success' });
        } catch (error: any) {
            results.errors.push(`Microsoft: ${error.message}`);
            results.steps.push({ service: 'Microsoft 365', status: 'failed', error: error.message });
        }

        // Step 5: Create Snipe-IT user
        try {
            const { createSnipeITUser } = await import('@/services/snipeit');
            const snipeUser = await createSnipeITUser({
                firstName: employeeData.firstName,
                lastName: employeeData.lastName,
                email: employeeData.email,
                employeeNum: employeeData.employeeId,
            });
            results.steps.push({ service: 'Snipe-IT', status: 'success', userId: snipeUser.id });

            // Step 6: Assign laptop if required
            if (employeeData.laptopRequired && snipeUser.id) {
                try {
                    // In a real implementation, you would:
                    // 1. Query available assets matching the laptop type
                    // 2. Assign the asset to the user
                    // 3. Create shipping ticket if remote
                    console.log(`Laptop assignment needed for ${employeeData.email}: ${employeeData.laptopType}`);
                    results.steps.push({
                        service: 'Asset Assignment',
                        status: 'pending',
                        note: 'Manual asset assignment required'
                    });
                } catch (error: any) {
                    results.errors.push(`Asset Assignment: ${error.message}`);
                }
            }
        } catch (error: any) {
            results.errors.push(`Snipe-IT: ${error.message}`);
            results.steps.push({ service: 'Snipe-IT', status: 'failed', error: error.message });
        }

        // Step 7: Send notifications
        try {
            await sendOnboardingNotifications(employeeData, results);
            results.steps.push({ service: 'Notifications', status: 'success' });
        } catch (error: any) {
            results.errors.push(`Notifications: ${error.message}`);
        }

        // Log audit event
        await logAuditEvent({
            eventType: 'automated_onboarding',
            employeeEmail: employeeData.email,
            source: employeeData.source || 'HRMS',
            results,
            timestamp: new Date(),
        });

        console.log(`Automated onboarding completed for ${employeeData.email}`, results);

    } catch (error: any) {
        results.success = false;
        results.errors.push(`Workflow error: ${error.message}`);
        console.error('Automated onboarding failed:', error);
        throw error;
    }

    return results;
}

/**
 * Execute automated offboarding workflow
 */
export async function executeAutomatedOffboarding(employeeData: any) {
    const results = {
        employee: employeeData.email,
        steps: [] as any[],
        success: true,
        errors: [] as string[],
        assetsPending: false,
    };

    try {
        console.log(`Starting automated offboarding for ${employeeData.email}`);

        // Step 1: Check for assigned assets
        try {
            const { getUserAssets } = await import('@/services/snipeit');
            const assetCheck = await getUserAssets(employeeData.email);

            if (assetCheck.hasAssets && assetCheck.assets.length > 0) {
                results.assetsPending = true;
                results.steps.push({
                    service: 'Asset Check',
                    status: 'pending',
                    assetCount: assetCheck.assets.length,
                    assets: assetCheck.assets
                });

                // Create Jira ticket for asset collection
                try {
                    const { createJiraTicket } = await import('@/services/snipeit');
                    const jiraResult = await createJiraTicket(
                        employeeData.email,
                        `${employeeData.firstName} ${employeeData.lastName}`,
                        assetCheck.assets
                    );

                    if (jiraResult.success) {
                        results.steps.push({
                            service: 'Jira Ticket',
                            status: 'success',
                            ticketKey: jiraResult.ticketKey,
                            ticketUrl: jiraResult.ticketUrl
                        });
                    }
                } catch (error: any) {
                    results.errors.push(`Jira: ${error.message}`);
                }

                // Send IT notification
                try {
                    const { sendITLaptopCollectionEmail } = await import('@/lib/email');
                    await sendITLaptopCollectionEmail(
                        employeeData.email,
                        'To be determined',
                        `${employeeData.firstName} ${employeeData.lastName}`
                    );
                    results.steps.push({ service: 'IT Notification', status: 'success' });
                } catch (error: any) {
                    results.errors.push(`Email: ${error.message}`);
                }

                console.log(`Offboarding paused for ${employeeData.email} - assets must be collected first`);

                // Log and return - don't proceed with account deactivation
                await logAuditEvent({
                    eventType: 'automated_offboarding_paused',
                    employeeEmail: employeeData.email,
                    source: employeeData.source || 'HRMS',
                    results,
                    timestamp: new Date(),
                });

                return results;
            }

            results.steps.push({ service: 'Asset Check', status: 'success', assetCount: 0 });
        } catch (error: any) {
            results.errors.push(`Asset Check: ${error.message}`);
        }

        // Step 2: Deactivate accounts (only if no assets or assets collected)

        // Google Workspace
        try {
            const { deleteGoogleUser } = await import('@/services/google');
            await deleteGoogleUser(employeeData.email);
            results.steps.push({ service: 'Google Workspace', status: 'deactivated' });
        } catch (error: any) {
            results.errors.push(`Google: ${error.message}`);
        }

        // Okta
        try {
            const { deactivateOktaUser } = await import('@/services/okta');
            // Note: Would need to look up Okta user ID from email
            // await deactivateOktaUser(oktaUserId);
            results.steps.push({ service: 'Okta', status: 'skipped', note: 'User ID lookup needed' });
        } catch (error: any) {
            results.errors.push(`Okta: ${error.message}`);
        }

        // Microsoft 365
        try {
            const { deleteMicrosoftUser } = await import('@/services/microsoft');
            await deleteMicrosoftUser(employeeData.email);
            results.steps.push({ service: 'Microsoft 365', status: 'deactivated' });
        } catch (error: any) {
            results.errors.push(`Microsoft: ${error.message}`);
        }

        // Step 3: Send completion notification
        try {
            await sendOffboardingNotifications(employeeData, results);
            results.steps.push({ service: 'Notifications', status: 'success' });
        } catch (error: any) {
            results.errors.push(`Notifications: ${error.message}`);
        }

        // Log audit event
        await logAuditEvent({
            eventType: 'automated_offboarding_completed',
            employeeEmail: employeeData.email,
            source: employeeData.source || 'HRMS',
            results,
            timestamp: new Date(),
        });

        console.log(`Automated offboarding completed for ${employeeData.email}`, results);

    } catch (error: any) {
        results.success = false;
        results.errors.push(`Workflow error: ${error.message}`);
        console.error('Automated offboarding failed:', error);
        throw error;
    }

    return results;
}

/**
 * Send onboarding notifications
 */
async function sendOnboardingNotifications(employeeData: any, results: any) {
    // Send to IT admin
    const itEmail = process.env.IT_ADMIN_EMAIL;
    if (itEmail) {
        console.log(`Sending onboarding notification to ${itEmail}`);
        // Email implementation would go here
    }

    // Send to HR
    const hrEmail = process.env.HR_EMAIL;
    if (hrEmail) {
        console.log(`Sending onboarding confirmation to ${hrEmail}`);
        // Email implementation would go here
    }
}

/**
 * Send offboarding notifications
 */
async function sendOffboardingNotifications(employeeData: any, results: any) {
    // Send to IT admin
    const itEmail = process.env.IT_ADMIN_EMAIL;
    if (itEmail) {
        console.log(`Sending offboarding notification to ${itEmail}`);
        // Email implementation would go here
    }

    // Send to HR
    const hrEmail = process.env.HR_EMAIL;
    if (hrEmail) {
        console.log(`Sending offboarding confirmation to ${hrEmail}`);
        // Email implementation would go here
    }
}
