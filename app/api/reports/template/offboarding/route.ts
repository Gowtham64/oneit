import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (authResult.error) return authResult.response;

    const dateLabel = new Date().toISOString().slice(0, 10);

  // Clean CSV: first row = headers, subsequent rows = examples
  const rows = [
    // Headers
    ['email', 'userId', 'reason', 'collectLaptop', 'collectionAddress', 'managerEmail'],
    // Example rows
    ['john.doe@company.com', 'EMP-001', 'Resignation', 'yes', '123 Main St, San Francisco CA 94105', 'manager@company.com'],
    ['jane.smith@company.com', 'EMP-002', 'Contract End', 'yes', '456 Oak Ave, New York NY 10001', 'manager@company.com'],
    ['bob.johnson@company.com', 'EMP-003', 'Termination', 'no', '', 'manager@company.com'],
  ];

  function escape(v: string): string {
    const s = v.replace(/"/g, '""');
    return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
  }

  const csv = rows.map(row => row.map(escape).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="offboarding-template-${dateLabel}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
