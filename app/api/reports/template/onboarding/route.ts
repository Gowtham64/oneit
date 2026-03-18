import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (authResult.error) return authResult.response;

    const dateLabel = new Date().toISOString().slice(0, 10);

  // Clean CSV: first row = headers, subsequent rows = examples
  const rows = [
    // Headers
    ['firstName', 'lastName', 'email', 'personalEmail', 'phone', 'department', 'jobTitle', 'employeeId', 'startDate', 'manager', 'laptopRequired', 'laptopOS', 'laptopType', 'laptopConfig'],
    // Example rows
    ['John', 'Doe', 'john.doe@company.com', 'john.personal@gmail.com', '+1-555-0001', 'Engineering', 'Software Engineer', 'EMP-001', '2026-04-01', 'Jane Smith', 'yes', 'macOS', 'MacBook Pro 14', 'Standard - 16GB RAM 512GB SSD'],
    ['Jane', 'Smith', 'jane.smith@company.com', 'jane.personal@gmail.com', '+1-555-0002', 'Marketing', 'Marketing Manager', 'EMP-002', '2026-04-01', 'Bob Johnson', 'yes', 'Windows', 'Dell XPS 15', 'Standard - 16GB RAM 512GB SSD'],
    ['Bob', 'Johnson', 'bob.johnson@company.com', 'bob.personal@gmail.com', '+1-555-0003', 'Finance', 'Financial Analyst', 'EMP-003', '2026-04-01', 'Alice Brown', 'no', '', '', ''],
  ];

  function escape(v: string): string {
    const s = v.replace(/"/g, '""');
    return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
  }

  const csv = rows.map(row => row.map(escape).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="onboarding-template-${dateLabel}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
