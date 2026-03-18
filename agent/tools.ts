import { tool } from "ai";
import { z } from "zod";
import { createGoogleUser, deleteGoogleUser } from "@/services/google";
import { inviteUserToSlack, createSlackChannel, sendMessage } from "@/services/slack";
import { createOktaUser, deactivateOktaUser } from "@/services/okta";
import { createMicrosoftUser, deleteMicrosoftUser } from "@/services/microsoft";
import { createSnipeItUser, checkOutAsset } from "@/services/snipeit";

export const tools = {
    onboardEmployee: tool({
        description: "Onboard a new employee across all systems (Google, Slack, Okta, Microsoft, Snipe-IT)",
        parameters: z.object({
            firstName: z.string().describe("The employee's first name"),
            lastName: z.string().describe("The employee's last name"),
            email: z.string().email().describe("The employee's email address"),
            department: z.string().optional().describe("The employee's department"),
            jobTitle: z.string().optional().describe("The employee's job title"),
        }),
        execute: async ({ firstName, lastName, email, department, jobTitle }: { firstName: string, lastName: string, email: string, department?: string, jobTitle?: string }) => {
            const results = {
                google: null as any,
                slack: null as any,
                okta: null as any,
                microsoft: null as any,
                snipeit: null as any,
                errors: [] as string[],
            };

            // 1. Google Workspace
            try {
                results.google = await createGoogleUser(firstName, lastName, email);
            } catch (e: any) {
                results.errors.push(`Google: ${e.message}`);
            }

            // 2. Slack
            try {
                results.slack = await inviteUserToSlack(email);
            } catch (e: any) {
                results.errors.push(`Slack: ${e.message}`);
            }

            // 3. Okta
            try {
                results.okta = await createOktaUser(firstName, lastName, email);
            } catch (e: any) {
                results.errors.push(`Okta: ${e.message}`);
            }

            // 4. Microsoft 365
            try {
                results.microsoft = await createMicrosoftUser(firstName, lastName, email);
            } catch (e: any) {
                results.errors.push(`Microsoft: ${e.message}`);
            }

            // 5. Snipe-IT
            try {
                results.snipeit = await createSnipeItUser(firstName, lastName, email);
            } catch (e: any) {
                results.errors.push(`Snipe-IT: ${e.message}`);
            }

            return {
                message: `Onboarding process completed for ${firstName} ${lastName}.`,
                details: results,
            };
        },
    } as any),

    offboardEmployee: tool({
        description: "Offboard an employee from all systems. IMPORTANT: First checks Snipe-IT for assets. If assets exist, creates Jira ticket and sends IT notification. Only proceeds with full offboarding if no assets are found.",
        parameters: z.object({
            email: z.string().email().describe("The employee's email address"),
            userId: z.string().optional().describe("The employee's internal system ID if known"),
            employeeName: z.string().optional().describe("The employee's full name"),
            collectionAddress: z.string().optional().describe("Address for IT to collect laptop/assets if applicable"),
        }),
        execute: async ({ email, userId, employeeName, collectionAddress }: { email: string, userId?: string, employeeName?: string, collectionAddress?: string }) => {
            const { getUserAssets, createJiraTicket } = await import("@/services/snipeit");
            const { sendITLaptopCollectionEmail } = await import("@/lib/email");

            const results = {
                assetCheck: null as any,
                jiraTicket: null as any,
                emailSent: false,
                offboarding: {
                    google: false,
                    okta: false,
                    microsoft: false,
                },
                errors: [] as string[],
                message: "",
            };

            try {
                // Step 1: Check Snipe-IT for assets
                const assetCheck = await getUserAssets(email);
                results.assetCheck = {
                    hasAssets: assetCheck.hasAssets,
                    assetCount: assetCheck.assets.length,
                    assets: assetCheck.assets,
                };

                if (assetCheck.hasAssets && assetCheck.assets.length > 0) {
                    // Assets found - create Jira ticket and send email
                    results.message = `⚠️ OFFBOARDING PAUSED: Employee has ${assetCheck.assets.length} asset(s) in Snipe-IT that must be collected first.`;

                    // Create Jira ticket
                    try {
                        const jiraResult = await createJiraTicket(
                            email,
                            employeeName || email,
                            assetCheck.assets,
                            collectionAddress
                        );

                        if (jiraResult.success) {
                            results.jiraTicket = {
                                key: jiraResult.ticketKey,
                                url: jiraResult.ticketUrl,
                            };
                            results.message += `\n✅ Jira ticket created: ${jiraResult.ticketKey}`;
                        } else {
                            results.errors.push(`Jira ticket creation failed: ${jiraResult.error}`);
                        }
                    } catch (e: any) {
                        results.errors.push(`Jira: ${e.message}`);
                    }

                    // Send IT email notification
                    if (collectionAddress) {
                        try {
                            const emailResult = await sendITLaptopCollectionEmail(
                                email,
                                collectionAddress,
                                employeeName
                            );
                            results.emailSent = emailResult.success;
                            if (emailResult.success) {
                                results.message += `\n✅ IT notification email sent`;
                            }
                        } catch (e: any) {
                            results.errors.push(`Email: ${e.message}`);
                        }
                    }

                    results.message += `\n\n📋 Assets to collect:\n${assetCheck.assets.map((a: any) => `  - ${a.name} (${a.assetTag})`).join('\n')}`;
                    results.message += `\n\n⏸️  Full offboarding will NOT proceed until assets are collected and removed from Snipe-IT.`;

                    return results;
                } else {
                    // No assets - proceed with full offboarding
                    results.message = `✅ No assets found in Snipe-IT. Proceeding with full offboarding...`;

                    // Google Workspace
                    try {
                        await deleteGoogleUser(email);
                        results.offboarding.google = true;
                        results.message += `\n✅ Google Workspace account deleted`;
                    } catch (e: any) {
                        results.errors.push(`Google: ${e.message}`);
                    }

                    // Okta
                    if (userId) {
                        try {
                            await deactivateOktaUser(userId);
                            results.offboarding.okta = true;
                            results.message += `\n✅ Okta account deactivated`;
                        } catch (e: any) {
                            results.errors.push(`Okta: ${e.message}`);
                        }
                    }

                    // Microsoft 365
                    try {
                        await deleteMicrosoftUser(email);
                        results.offboarding.microsoft = true;
                        results.message += `\n✅ Microsoft 365 account deleted`;
                    } catch (e: any) {
                        results.errors.push(`Microsoft: ${e.message}`);
                    }

                    results.message += `\n\n✅ Offboarding completed successfully!`;
                }

                return results;
            } catch (error: any) {
                results.errors.push(`Asset check failed: ${error.message}`);
                results.message = `❌ Error during offboarding: ${error.message}`;
                return results;
            }
        },
    } as any),

    assignAsset: tool({
        description: "Assign an asset (e.g. laptop) to a user in Snipe-IT",
        parameters: z.object({
            assetTag: z.string().describe("The asset tag of the hardware"),
            userId: z.number().describe("The Snipe-IT user ID to assign to"),
        }),
        execute: async ({ assetTag, userId }: { assetTag: string, userId: number }) => {
            try {
                const result = await checkOutAsset(assetTag, userId);
                return {
                    success: true,
                    data: result,
                };
            } catch (error: any) {
                return {
                    success: false,
                    error: error.message,
                };
            }
        },
    } as any),

    createSlackChannel: tool({
        description: "Create a new Slack channel",
        parameters: z.object({
            channelName: z.string().describe("Name of the channel to create"),
        }),
        execute: async ({ channelName }: { channelName: string }) => {
            try {
                const result = await createSlackChannel(channelName);
                return { success: true, channel: result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        }
    } as any)
};
