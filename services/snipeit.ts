
const SNIPEIT_API_URL = process.env.SNIPEIT_API_URL;
const SNIPEIT_API_KEY = process.env.SNIPEIT_API_KEY;

const headers = {
    "Authorization": `Bearer ${SNIPEIT_API_KEY}`,
    "Content-Type": "application/json",
    "Accept": "application/json"
};

export async function createSnipeItUser(
    firstName: string,
    lastName: string,
    email: string
) {
    try {
        const res = await fetch(`${SNIPEIT_API_URL}/api/v1/users`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                username: email.split("@")[0],
                email: email,
                password: Math.random().toString(36).slice(-8), // Set a random password
                activated: true,
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to create Snipe-IT user: ${res.status} ${text}`);
        }

        return await res.json();
    } catch (error) {
        console.error("Error creating Snipe-IT user:", error);
        throw error;
    }
}

export async function checkOutAsset(assetTag: string, assignedToUserId: number) {
    try {
        const res = await fetch(`${SNIPEIT_API_URL}/api/v1/hardware/${assetTag}/checkout`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                checkout_to_type: "user",
                assigned_user: assignedToUserId,
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to checkout asset: ${res.status} ${text}`);
        }

        return await res.json();
    } catch (error) {
        console.error("Error checking out asset:", error);
        throw error;
    }
}

export async function getUserAssets(email: string) {
    try {
        // First, find the user by email
        const userRes = await fetch(`${SNIPEIT_API_URL}/api/v1/users?search=${encodeURIComponent(email)}`, {
            method: "GET",
            headers,
        });

        if (!userRes.ok) {
            throw new Error(`Failed to search for user: ${userRes.status}`);
        }

        const userData = await userRes.json();

        if (!userData.rows || userData.rows.length === 0) {
            return { hasAssets: false, assets: [], userId: null };
        }

        const userId = userData.rows[0].id;

        // Get assets assigned to this user
        const assetsRes = await fetch(`${SNIPEIT_API_URL}/api/v1/hardware?assigned_to=${userId}`, {
            method: "GET",
            headers,
        });

        if (!assetsRes.ok) {
            throw new Error(`Failed to get user assets: ${assetsRes.status}`);
        }

        const assetsData = await assetsRes.json();
        const assets = assetsData.rows || [];

        return {
            hasAssets: assets.length > 0,
            assets: assets.map((asset: any) => ({
                id: asset.id,
                assetTag: asset.asset_tag,
                name: asset.name,
                model: asset.model?.name,
                serial: asset.serial,
            })),
            userId,
        };
    } catch (error) {
        console.error("Error getting user assets:", error);
        throw error;
    }
}

export async function createJiraTicket(
    employeeEmail: string,
    employeeName: string,
    assets: any[],
    collectionAddress?: string
) {
    const JIRA_URL = process.env.JIRA_URL;
    const JIRA_EMAIL = process.env.JIRA_EMAIL;
    const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
    const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'IT';

    if (!JIRA_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
        console.warn('Jira credentials not configured');
        return { success: false, error: 'Jira not configured' };
    }

    try {
        const assetList = assets.map(a => `- ${a.name} (${a.assetTag}) - ${a.model || 'N/A'}`).join('\n');

        const description = `Employee offboarding requires asset collection.

*Employee Details:*
- Name: ${employeeName}
- Email: ${employeeEmail}
${collectionAddress ? `- Collection Address: ${collectionAddress}` : ''}

*Assets to Collect:*
${assetList}

Please schedule collection of the above assets.`;

        const res = await fetch(`${JIRA_URL}/rest/api/3/issue`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fields: {
                    project: { key: JIRA_PROJECT_KEY },
                    summary: `Asset Collection Required - ${employeeName}`,
                    description: {
                        type: 'doc',
                        version: 1,
                        content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: description }]
                        }]
                    },
                    issuetype: { name: 'Task' },
                },
            }),
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(`Failed to create Jira ticket: ${res.status} ${error}`);
        }

        const data = await res.json();
        return { success: true, ticketKey: data.key, ticketUrl: `${JIRA_URL}/browse/${data.key}` };
    } catch (error) {
        console.error('Error creating Jira ticket:', error);
        return { success: false, error };
    }
}
