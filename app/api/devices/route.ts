import { NextResponse } from 'next/server';

const JAMF_URL = process.env.JAMF_URL;
const JAMF_CLIENT_ID = process.env.JAMF_CLIENT_ID;
const JAMF_CLIENT_SECRET = process.env.JAMF_CLIENT_SECRET;
const SF_URL = process.env.SCALEFUSION_API_URL;
const SF_KEY = process.env.SCALEFUSION_API_KEY;

async function getJamfToken(): Promise<string | null> {
  try {
    const res = await fetch(`${JAMF_URL}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: JAMF_CLIENT_ID!,
        client_secret: JAMF_CLIENT_SECRET!,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token;
  } catch {
    return null;
  }
}

async function fetchJamfDevices(token: string) {
  const res = await fetch(`${JAMF_URL}/api/v1/computers-preview?page-size=200`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map((d: any) => ({
    id: `JAMF-${d.id}`,
    name: d.name || 'Unknown Mac',
    user: d.assignedUser?.realname || d.assignedUser?.username || 'Unassigned',
    serial: d.serialNumber || '—',
    os: d.operatingSystemVersion ? `macOS ${d.operatingSystemVersion}` : 'macOS',
    mdm: 'JAMF',
    type: 'mac',
    status: d.isManaged ? 'Healthy' : 'Warning',
    compliance: d.isManaged && d.isMdmCapable ? 'Compliant' : 'Non-Compliant',
    lastSeen: d.lastContactTime || 'Unknown',
  }));
}

async function fetchScalefusionDevices() {
  try {
    const res = await fetch(`${SF_URL}/api/v2/devices`, {
      headers: { Authorization: `Bearer ${SF_KEY}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.devices || []).map((d: any) => ({
      id: `SF-${d.id}`,
      name: d.device_name || 'Unknown Windows',
      user: d.user?.name || 'Unassigned',
      serial: d.serial_number || '—',
      os: `Windows ${d.os_version || '11'}`,
      mdm: 'Scalefusion',
      type: 'win',
      status: d.compliance_status === 'compliant' ? 'Healthy' : 'Warning',
      compliance: d.compliance_status === 'compliant' ? 'Compliant' : 'Non-Compliant',
      lastSeen: d.last_seen || 'Unknown',
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    // Try to fetch from real APIs, fall back to empty arrays if not configured
    const jamfDevices = JAMF_URL && JAMF_CLIENT_ID
      ? await getJamfToken().then(t => t ? fetchJamfDevices(t) : [])
      : [];

    const sfDevices = SF_URL && SF_KEY
      ? await fetchScalefusionDevices()
      : [];

    const allDevices = [...jamfDevices, ...sfDevices];

    // If no integrations are configured, return helpful message
    if (allDevices.length === 0) {
      return NextResponse.json({
        devices: [],
        meta: {
          total: 0,
          jamf: 0,
          scalefusion: 0,
          configured: {
            jamf: !!(JAMF_URL && JAMF_CLIENT_ID),
            scalefusion: !!(SF_URL && SF_KEY),
          },
        },
      });
    }

    return NextResponse.json({
      devices: allDevices,
      meta: {
        total: allDevices.length,
        jamf: jamfDevices.length,
        scalefusion: sfDevices.length,
        configured: { jamf: true, scalefusion: true },
      },
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json({ error: 'Failed to fetch devices', devices: [] }, { status: 500 });
  }
}
