import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrSuperAdmin, requireRole } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  const authResult = await requireAdminOrSuperAdmin(request);
  if (authResult.error) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    // Hard cap at 500 to prevent abuse
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);

    // Build filter
    const where: any = {};
    if (category !== 'all') {
      where.eventType = { contains: category.toUpperCase(), mode: 'insensitive' };
    }

    // Fetch audit logs from database
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const formatted = logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      actor: log.userId || 'System',
      target: log.entityId || '—',
      category: mapEventToCategory(log.eventType),
      severity: log.metadata?.severity || 'info',
      ts: log.createdAt.toISOString().replace('T', ' ').slice(0, 19),
      detail: log.metadata?.detail || log.details || '',
    }));

    return NextResponse.json({ logs: formatted, total: logs.length });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    // Return empty state if DB not configured
    return NextResponse.json({ logs: [], total: 0, error: 'Database not configured' });
  }
}

function mapEventToCategory(eventType: string): string {
  const type = eventType?.toLowerCase() || '';
  if (type.includes('onboard')) return 'onboarding';
  if (type.includes('offboard')) return 'offboarding';
  if (type.includes('security') || type.includes('mfa') || type.includes('alert')) return 'security';
  if (type.includes('compliance') || type.includes('policy')) return 'compliance';
  if (type.includes('asset') || type.includes('device')) return 'asset';
  if (type.includes('provision') || type.includes('create')) return 'provisioning';
  return 'system';
}

// POST endpoint to write new audit events — restricted to SUPER_ADMIN
export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, 'SUPER_ADMIN');
  if (authResult.error) return authResult.response;

  try {
    const body = await request.json();
    const { action, actor, target, category, severity, detail } = body;

    const log = await prisma.auditLog.create({
      data: {
        eventType: category?.toUpperCase() || 'SYSTEM',
        action,
        userId: actor,
        entityId: target,
        entityType: category || 'system',
        details: { severity: severity || 'info', detail },
      },
    });

    return NextResponse.json({ success: true, id: log.id });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
  }
}
