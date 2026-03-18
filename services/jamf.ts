import fetch from 'isomorphic-fetch';

const JAMF_URL = process.env.JAMF_URL;
const JAMF_USERNAME = process.env.JAMF_USERNAME;
const JAMF_PASSWORD = process.env.JAMF_PASSWORD;

// Base64 encode credentials for basic auth
const getAuthHeader = () => {
    const credentials = `${JAMF_USERNAME}:${JAMF_PASSWORD}`;
    const encoded = Buffer.from(credentials).toString('base64');
    return `Basic ${encoded}`;
};

/**
 * Get all computers from JAMF
 */
export async function getJAMFComputers() {
    try {
        const response = await fetch(`${JAMF_URL}/JSSResource/computers`, {
            method: 'GET',
            headers: {
                'Authorization': getAuthHeader(),
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`JAMF API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.computers || [];
    } catch (error) {
        console.error('Error fetching JAMF computers:', error);
        throw error;
    }
}

/**
 * Get computer details by ID
 */
export async function getJAMFComputerDetails(computerId: string) {
    try {
        const response = await fetch(`${JAMF_URL}/JSSResource/computers/id/${computerId}`, {
            method: 'GET',
            headers: {
                'Authorization': getAuthHeader(),
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`JAMF API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.computer;
    } catch (error) {
        console.error('Error fetching JAMF computer details:', error);
        throw error;
    }
}

/**
 * Assign MacBook to user in JAMF
 */
export async function assignJAMFComputer(computerId: string, userEmail: string, userName: string) {
    try {
        const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<computer>
    <location>
        <username>${userEmail}</username>
        <realname>${userName}</realname>
        <email_address>${userEmail}</email_address>
    </location>
</computer>`;

        const response = await fetch(`${JAMF_URL}/JSSResource/computers/id/${computerId}`, {
            method: 'PUT',
            headers: {
                'Authorization': getAuthHeader(),
                'Content-Type': 'application/xml',
            },
            body: xmlData,
        });

        if (!response.ok) {
            throw new Error(`JAMF API error: ${response.statusText}`);
        }

        return { success: true, computerId };
    } catch (error) {
        console.error('Error assigning JAMF computer:', error);
        throw error;
    }
}

/**
 * Unassign MacBook from user in JAMF
 */
export async function unassignJAMFComputer(computerId: string) {
    try {
        const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<computer>
    <location>
        <username></username>
        <realname></realname>
        <email_address></email_address>
    </location>
</computer>`;

        const response = await fetch(`${JAMF_URL}/JSSResource/computers/id/${computerId}`, {
            method: 'PUT',
            headers: {
                'Authorization': getAuthHeader(),
                'Content-Type': 'application/xml',
            },
            body: xmlData,
        });

        if (!response.ok) {
            throw new Error(`JAMF API error: ${response.statusText}`);
        }

        return { success: true, computerId };
    } catch (error) {
        console.error('Error unassigning JAMF computer:', error);
        throw error;
    }
}

/**
 * Get available (unassigned) MacBooks
 */
export async function getAvailableJAMFComputers() {
    try {
        const computers = await getJAMFComputers();
        const available = [];

        for (const computer of computers) {
            const details = await getJAMFComputerDetails(computer.id);
            // Check if computer is not assigned to anyone
            if (!details.location?.username || details.location.username === '') {
                available.push({
                    id: computer.id,
                    name: computer.name,
                    serialNumber: details.general?.serial_number,
                    model: details.hardware?.model,
                });
            }
        }

        return available;
    } catch (error) {
        console.error('Error fetching available JAMF computers:', error);
        throw error;
    }
}
