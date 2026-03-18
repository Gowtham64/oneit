import { NextResponse } from 'next/server';

const SNIPEIT_API_URL = process.env.SNIPEIT_API_URL;
const SNIPEIT_API_KEY = process.env.SNIPEIT_API_KEY;
const JAMF_URL = process.env.JAMF_URL;
const JAMF_CLIENT_ID = process.env.JAMF_CLIENT_ID;
const JAMF_CLIENT_SECRET = process.env.JAMF_CLIENT_SECRET;
const SF_URL = process.env.SCALEFUSION_API_URL;
const SF_KEY = process.env.SCALEFUSION_API_KEY;

// ── helpers ────────────────────────────────────────────────────────────────

function csvEscape(v: any): string {
  const s = String(v ?? '').replace(/"/g, '""');
  return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
}

function csvRow(fields: any[]): string {
  return fields.map(csvEscape).join(',');
}

function section(title: string, headers: string[], rows: any[][]): string {
  if (rows.length === 0) return `\n[${title}]\nNo data available (integration not configured or no records found)\n`;
  return [
    `\n[${title}]`,
    headers.join(','),
    ...rows.map(r => csvRow(r)),
  ].join('\n');
}

const snipeitHeaders = { Authorization: `Bearer ${SNIPEIT_API_KEY}`, Accept: 'application/json' };

async function getJamfToken(): Promise<string | null> {
  if (!JAMF_URL || !JAMF_CLIENT_ID) return null;
  try {
    const r = await fetch(`${JAMF_URL}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: JAMF_CLIENT_ID!, client_secret: JAMF_CLIENT_SECRET! }),
    });
    if (!r.ok) return null;
    return (await r.json()).access_token ?? null;
  } catch { return null; }
}

// ── data fetchers ──────────────────────────────────────────────────────────

async function fetchSnipeitAssets(): Promise<any[][]> {
  if (!SNIPEIT_API_URL || !SNIPEIT_API_KEY) return [];
  try {
    const r = await fetch(`${SNIPEIT_API_URL}/api/v1/hardware?limit=500`, { headers: snipeitHeaders });
    if (!r.ok) return [];
    const rows = (await r.json()).rows ?? [];
    return rows.map((a: any) => [
      a.asset_tag ?? '', a.name ?? '', a.model?.name ?? '', a.category?.name ?? '',
      a.serial ?? '', a.status_label?.name ?? '',
      a.assigned_to?.name ?? 'Unassigned', a.assigned_to?.email ?? '',
      a.purchase_date?.formatted ?? '', a.location?.name ?? '',
      a.created_at?.formatted ?? '',
    ]);
  } catch { return []; }
}

async function fetchJamfDevices(token: string): Promise<any[][]> {
  try {
    const r = await fetch(`${JAMF_URL}/api/v1/computers-preview?page-size=500`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!r.ok) return [];
    return ((await r.json()).results ?? []).map((d: any) => [
      d.id ?? '', d.name ?? '', 'macOS', d.operatingSystemVersion ?? '',
      d.serialNumber ?? '', d.assignedUser?.realname ?? 'Unassigned',
      d.assignedUser?.username ?? '', d.isManaged ? 'Managed' : 'Unmanaged',
      d.isMdmCapable ? 'MDM Capable' : 'No MDM', d.lastContactTime ?? '',
    ]);
  } catch { return []; }
}

async function fetchScalefusionDevices(): Promise<any[][]> {
  if (!SF_URL || !SF_KEY) return [];
  try {
    const r = await fetch(`${SF_URL}/api/v2/devices`, {
      headers: { Authorization: `Bearer ${SF_KEY}` },
    });
    if (!r.ok) return [];
    return ((await r.json()).devices ?? []).map((d: any) => [
      d.id ?? '', d.device_name ?? '', 'Windows', d.os_version ?? '',
      d.serial_number ?? '', d.user?.name ?? 'Unassigned',
      d.user?.email ?? '', d.compliance_status ?? '',
      d.last_seen ?? '',
    ]);
  } catch { return []; }
}

async function fetchPrismaOnboarding(): Promise<any[][]> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const records = await prisma.onboardingRecord.findMany({
      take: 500, orderBy: { createdAt: 'desc' },
      include: { employee: true },
    });
    return records.map((r: any) => [
      r.id, r.employee?.firstName + ' ' + r.employee?.lastName,
      r.employee?.email ?? '', r.employee?.department ?? '',
      r.employee?.jobTitle ?? '', r.status,
      r.source ?? '', r.initiatedBy ?? '',
      r.createdAt?.toISOString().slice(0, 10) ?? '',
      r.completedAt?.toISOString().slice(0, 10) ?? '',
    ]);
  } catch { return []; }
}

async function fetchPrismaOffboarding(): Promise<any[][]> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const records = await prisma.offboardingRecord.findMany({
      take: 500, orderBy: { createdAt: 'desc' },
      include: { employee: true },
    });
    return records.map((r: any) => [
      r.id, r.employee?.firstName + ' ' + r.employee?.lastName,
      r.employee?.email ?? '', r.employee?.department ?? '',
      r.status, r.reason ?? '', r.laptopCollected ? 'Yes' : 'No',
      r.initiatedBy ?? '', r.createdAt?.toISOString().slice(0, 10) ?? '',
      r.completedAt?.toISOString().slice(0, 10) ?? '',
    ]);
  } catch { return []; }
}

async function fetchPrismaAuditLogs(): Promise<any[][]> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const logs = await prisma.auditLog.findMany({
      take: 500, orderBy: { createdAt: 'desc' },
    });
    return logs.map((l: any) => [
      l.id, l.createdAt?.toISOString().replace('T', ' ').slice(0, 19) ?? '',
      l.eventType ?? '', l.action ?? '', l.userId ?? 'System',
      l.entityType ?? '', l.entityId ?? '',
      JSON.stringify(l.metadata ?? {}).slice(0, 120),
    ]);
  } catch { return []; }
}

async function fetchSnipeitUsers(): Promise<any[][]> {
  if (!SNIPEIT_API_URL || !SNIPEIT_API_KEY) return [];
  try {
    const r = await fetch(`${SNIPEIT_API_URL}/api/v1/users?limit=500`, { headers: snipeitHeaders });
    if (!r.ok) return [];
    return ((await r.json()).rows ?? []).map((u: any) => [
      u.id, u.first_name + ' ' + u.last_name, u.email ?? '',
      u.username ?? '', u.department?.name ?? '',
      u.assets_count ?? 0, u.activated ? 'Active' : 'Inactive',
      u.created_at?.formatted ?? '',
    ]);
  } catch { return []; }
}

// ── main handler ───────────────────────────────────────────────────────────

export async function GET() {
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').slice(0, 19);
  const dateLabel = now.toISOString().slice(0, 10);

  // Fetch all data in parallel
  const jamfToken = await getJamfToken();

  const [snipeitAssets, jamfDevices, sfDevices, onboarding, offboarding, auditLogs, snipeitUsers] =
    await Promise.allSettled([
      fetchSnipeitAssets(),
      jamfToken ? fetchJamfDevices(jamfToken) : Promise.resolve([]),
      fetchScalefusionDevices(),
      fetchPrismaOnboarding(),
      fetchPrismaOffboarding(),
      fetchPrismaAuditLogs(),
      fetchSnipeitUsers(),
    ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : []));

  // Build integration status summary
  const integrations = [
    ['Snipe-IT (Asset Management)', SNIPEIT_API_URL ? 'Configured' : 'Not configured', SNIPEIT_API_URL ?? '—', (snipeitAssets as any[][]).length + ' assets'],
    ['JAMF (Mac MDM)', jamfToken ? 'Configured' : 'Not configured', JAMF_URL ?? '—', (jamfDevices as any[][]).length + ' devices'],
    ['Scalefusion (Windows MDM)', SF_URL ? 'Configured' : 'Not configured', SF_URL ?? '—', (sfDevices as any[][]).length + ' devices'],
    ['Google Workspace', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Configured' : 'Not configured', '—', '—'],
    ['Okta', process.env.OKTA_DOMAIN ? 'Configured' : 'Not configured', process.env.OKTA_DOMAIN ?? '—', '—'],
    ['Microsoft 365', process.env.AZURE_TENANT_ID ? 'Configured' : 'Not configured', '—', '—'],
    ['Slack', process.env.SLACK_BOT_TOKEN ? 'Configured' : 'Not configured', '—', '—'],
  ];

  const csv = [
    `OneIT Platform — Comprehensive Report`,
    `Generated: ${dateStr}`,
    ``,

    section('INTEGRATION STATUS',
      ['Tool', 'Status', 'Endpoint / Domain', 'Records Found'],
      integrations
    ),

    section('ASSET INVENTORY (Snipe-IT)',
      ['Asset Tag', 'Name', 'Model', 'Category', 'Serial', 'Status', 'Assigned To', 'User Email', 'Purchase Date', 'Location', 'Created'],
      snipeitAssets as any[][]
    ),

    section('SNIPE-IT USERS',
      ['ID', 'Name', 'Email', 'Username', 'Department', 'Assets Assigned', 'Status', 'Created'],
      snipeitUsers as any[][]
    ),

    section('MAC DEVICES (JAMF)',
      ['ID', 'Device Name', 'OS', 'OS Version', 'Serial', 'Assigned User', 'Username', 'Management Status', 'MDM Capability', 'Last Contact'],
      jamfDevices as any[][]
    ),

    section('WINDOWS DEVICES (Scalefusion)',
      ['ID', 'Device Name', 'OS', 'OS Version', 'Serial', 'Assigned User', 'User Email', 'Compliance Status', 'Last Seen'],
      sfDevices as any[][]
    ),

    section('ONBOARDING RECORDS',
      ['Record ID', 'Employee Name', 'Email', 'Department', 'Job Title', 'Status', 'Source', 'Initiated By', 'Start Date', 'Completed Date'],
      onboarding as any[][]
    ),

    section('OFFBOARDING RECORDS',
      ['Record ID', 'Employee Name', 'Email', 'Department', 'Status', 'Reason', 'Laptop Collected', 'Initiated By', 'Start Date', 'Completed Date'],
      offboarding as any[][]
    ),

    section('AUDIT LOG (Most Recent 500)',
      ['Log ID', 'Timestamp', 'Event Type', 'Action', 'User / Actor', 'Entity Type', 'Entity ID', 'Details'],
      auditLogs as any[][]
    ),
  ].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="oneit-comprehensive-report-${dateLabel}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
