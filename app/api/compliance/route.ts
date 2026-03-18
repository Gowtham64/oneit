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
  } catch { return null; }
}

export async function GET() {
  try {
    let jamfCompliance: any[] = [];
    let sfCompliance: any[] = [];

    if (JAMF_URL && JAMF_CLIENT_ID) {
      const token = await getJamfToken();
      if (token) {
        try {
          const res = await fetch(`${JAMF_URL}/api/v1/computers-preview?page-size=500`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          });
          if (res.ok) {
            const data = await res.json();
            const computers = data.results || [];
            jamfCompliance = [
              {
                policy: 'Disk Encryption',
                compliant: computers.filter((c: any) => c.diskEncryptionEnabled !== false).length,
                total: computers.length,
                source: 'JAMF',
                severity: 'critical',
              },
              {
                policy: 'MDM Enrolled',
                compliant: computers.filter((c: any) => c.isMdmCapable).length,
                total: computers.length,
                source: 'JAMF',
                severity: 'critical',
              },
              {
                policy: 'OS Up to Date',
                compliant: computers.filter((c: any) => {
                  const v = c.operatingSystemVersion;
                  return v && parseInt(v.split('.')[0]) >= 14;
                }).length,
                total: computers.length,
                source: 'JAMF',
                severity: 'high',
              },
            ];
          }
        } catch { /* ignore */ }
      }
    }

    if (SF_URL && SF_KEY) {
      try {
        const res = await fetch(`${SF_URL}/api/v2/devices?page_size=500`, {
          headers: { Authorization: `Bearer ${SF_KEY}` },
        });
        if (res.ok) {
          const data = await res.json();
          const devices = data.devices || [];
          sfCompliance = [
            {
              policy: 'Disk Encryption',
              compliant: devices.filter((d: any) => d.disk_encrypted).length,
              total: devices.length,
              source: 'Scalefusion',
              severity: 'critical',
            },
            {
              policy: 'Antivirus Active',
              compliant: devices.filter((d: any) => d.antivirus_enabled).length,
              total: devices.length,
              source: 'Scalefusion',
              severity: 'high',
            },
          ];
        }
      } catch { /* ignore */ }
    }

    const policies = [...jamfCompliance, ...sfCompliance];

    const overallPct = policies.length > 0
      ? Math.round((policies.reduce((a, p) => a + p.compliant, 0) / policies.reduce((a, p) => a + p.total, 0)) * 100)
      : 0;

    return NextResponse.json({
      policies,
      summary: {
        overallPercent: overallPct,
        passing: policies.filter(p => p.compliant === p.total).length,
        failing: policies.filter(p => p.compliant < p.total).length,
        configured: {
          jamf: !!(JAMF_URL && JAMF_CLIENT_ID),
          scalefusion: !!(SF_URL && SF_KEY),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching compliance:', error);
    return NextResponse.json({ error: 'Failed to fetch compliance data', policies: [] }, { status: 500 });
  }
}
