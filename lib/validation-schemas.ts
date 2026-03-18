import { z } from 'zod';

// ============================================
// EMPLOYEE SCHEMAS
// ============================================

export const employeeSchema = z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    personalEmail: z.string().email('Invalid personal email').optional().nullable(),
    phone: z.string().optional().nullable(),
    department: z.string().min(1, 'Department is required'),
    jobTitle: z.string().min(1, 'Job title is required'),
    manager: z.string().optional().nullable(),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()).optional().nullable(),
    employeeType: z.enum(['Full-Time', 'Part-Time', 'Contractor']),
    location: z.string().min(1, 'Location is required'),
    laptopRequired: z.boolean().default(false),
    laptopType: z.string().optional().nullable(),
    laptopConfig: z.string().optional().nullable(),

    // Google Workspace Configuration
    googleOrgUnit: z.string().default('/'),

    // Slack Configuration
    slackMemberType: z.enum(['MEMBER', 'SINGLE_CHANNEL', 'MULTI_CHANNEL']).default('MEMBER'),
    slackChannels: z.array(z.string()).optional().nullable(),
});

export const updateEmployeeSchema = employeeSchema.partial();

// ============================================
// ONBOARDING SCHEMAS
// ============================================

export const onboardingSchema = z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    source: z.enum(['Manual', 'HRMS', 'Bulk']).default('Manual'),
    initiatedBy: z.string().optional(),
});

export const bulkOnboardingSchema = z.object({
    employees: z.array(employeeSchema),
    source: z.literal('Bulk'),
});

// ============================================
// OFFBOARDING SCHEMAS
// ============================================

export const offboardingSchema = z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    source: z.enum(['Manual', 'HRMS', 'Bulk']).default('Manual'),
    collectionAddress: z.string().optional(),
    initiatedBy: z.string().optional(),
});

export const bulkOffboardingSchema = z.object({
    employeeIds: z.array(z.string()),
    source: z.literal('Bulk'),
});

// ============================================
// INTEGRATION SCHEMAS
// ============================================

export const integrationConfigSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['google', 'slack', 'okta', 'microsoft', 'snipeit', 'hrms']),
    enabled: z.boolean().default(true),
    config: z.record(z.any()),
});

// ============================================
// SECURITY POLICY SCHEMAS
// ============================================

export const securityPolicySchema = z.object({
    mfaRequired: z.boolean(),
    passwordMinLength: z.number().min(8).max(20),
    passwordRequireUpper: z.boolean(),
    passwordRequireLower: z.boolean(),
    passwordRequireNumber: z.boolean(),
    passwordRequireSpecial: z.boolean(),
    sessionTimeoutMinutes: z.number().min(15).max(120),
    ipWhitelistEnabled: z.boolean(),
    allowedIpRanges: z.array(z.string()).optional().nullable(),
    auditLoggingEnabled: z.boolean(),
});

// ============================================
// QUERY SCHEMAS
// ============================================

export const employeeQuerySchema = z.object({
    status: z.enum(['ACTIVE', 'OFFBOARDING', 'OFFBOARDED', 'SUSPENDED']).optional(),
    department: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
});

export const auditLogQuerySchema = z.object({
    eventType: z.string().optional(),
    userId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
});
