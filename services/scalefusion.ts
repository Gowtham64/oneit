import fetch from 'isomorphic-fetch';

const SCALEFUSION_API_URL = process.env.SCALEFUSION_API_URL;
const SCALEFUSION_API_KEY = process.env.SCALEFUSION_API_KEY;
const SCALEFUSION_ORG_ID = process.env.SCALEFUSION_ORG_ID;

const getHeaders = () => ({
    'Authorization': `Bearer ${SCALEFUSION_API_KEY}`,
    'Content-Type': 'application/json',
});

/**
 * Get all Windows devices from Scalefusion
 */
export async function getScalefusionDevices() {
    try {
        const response = await fetch(`${SCALEFUSION_API_URL}/api/v1/devices?org_id=${SCALEFUSION_ORG_ID}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Scalefusion API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.devices || [];
    } catch (error) {
        console.error('Error fetching Scalefusion devices:', error);
        throw error;
    }
}

/**
 * Get device details by ID
 */
export async function getScalefusionDeviceDetails(deviceId: string) {
    try {
        const response = await fetch(`${SCALEFUSION_API_URL}/api/v1/devices/${deviceId}?org_id=${SCALEFUSION_ORG_ID}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Scalefusion API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.device;
    } catch (error) {
        console.error('Error fetching Scalefusion device details:', error);
        throw error;
    }
}

/**
 * Assign Windows device to user in Scalefusion
 */
export async function assignScalefusionDevice(deviceId: string, userEmail: string, userName: string) {
    try {
        const response = await fetch(`${SCALEFUSION_API_URL}/api/v1/devices/${deviceId}/assign`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                org_id: SCALEFUSION_ORG_ID,
                user_email: userEmail,
                user_name: userName,
            }),
        });

        if (!response.ok) {
            throw new Error(`Scalefusion API error: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, deviceId, data };
    } catch (error) {
        console.error('Error assigning Scalefusion device:', error);
        throw error;
    }
}

/**
 * Unassign Windows device from user in Scalefusion
 */
export async function unassignScalefusionDevice(deviceId: string) {
    try {
        const response = await fetch(`${SCALEFUSION_API_URL}/api/v1/devices/${deviceId}/unassign`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                org_id: SCALEFUSION_ORG_ID,
            }),
        });

        if (!response.ok) {
            throw new Error(`Scalefusion API error: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, deviceId, data };
    } catch (error) {
        console.error('Error unassigning Scalefusion device:', error);
        throw error;
    }
}

/**
 * Get available (unassigned) Windows devices
 */
export async function getAvailableScalefusionDevices() {
    try {
        const response = await fetch(`${SCALEFUSION_API_URL}/api/v1/devices?org_id=${SCALEFUSION_ORG_ID}&status=available`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Scalefusion API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.devices || [];
    } catch (error) {
        console.error('Error fetching available Scalefusion devices:', error);
        throw error;
    }
}

/**
 * Enroll new Windows device in Scalefusion
 */
export async function enrollScalefusionDevice(deviceInfo: {
    deviceName: string;
    serialNumber: string;
    imei?: string;
}) {
    try {
        const response = await fetch(`${SCALEFUSION_API_URL}/api/v1/devices/enroll`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                org_id: SCALEFUSION_ORG_ID,
                ...deviceInfo,
            }),
        });

        if (!response.ok) {
            throw new Error(`Scalefusion API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error enrolling Scalefusion device:', error);
        throw error;
    }
}
