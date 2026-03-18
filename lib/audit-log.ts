/**
 * Audit logging for HRMS-triggered operations
 */

interface AuditLogEntry {
    eventType: string;
    employeeEmail: string;
    source: string;
    results: any;
    timestamp: Date;
}

// In-memory audit log (for production, use database)
const auditLog: AuditLogEntry[] = [];

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry) {
    auditLog.push(entry);

    // Also log to console for debugging
    console.log('[AUDIT]', {
        type: entry.eventType,
        employee: entry.employeeEmail,
        source: entry.source,
        timestamp: entry.timestamp.toISOString(),
    });

    // In production, you would save to database here
    // await prisma.auditLog.create({ data: entry });
}

/**
 * Get recent audit logs
 */
export function getRecentAuditLogs(limit: number = 100): AuditLogEntry[] {
    return auditLog
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
}

/**
 * Get audit logs for a specific employee
 */
export function getEmployeeAuditLogs(email: string): AuditLogEntry[] {
    return auditLog
        .filter(entry => entry.employeeEmail === email)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Get audit logs by event type
 */
export function getAuditLogsByType(eventType: string): AuditLogEntry[] {
    return auditLog
        .filter(entry => entry.eventType === eventType)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
