import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create default security policy
    const securityPolicy = await prisma.securityPolicy.upsert({
        where: { id: 'default-policy' },
        update: {},
        create: {
            id: 'default-policy',
            mfaRequired: true,
            passwordMinLength: 12,
            passwordRequireUpper: true,
            passwordRequireLower: true,
            passwordRequireNumber: true,
            passwordRequireSpecial: true,
            sessionTimeoutMinutes: 30,
            ipWhitelistEnabled: false,
            auditLoggingEnabled: true,
            updatedBy: 'system',
        },
    });

    console.log('✅ Created default security policy');

    // Create admin user
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@company.com' },
        update: { role: 'ADMIN' },
        create: {
            email: 'admin@company.com',
            name: 'Admin User',
            role: 'ADMIN',
            mfaEnabled: false,
        },
    });

    console.log('✅ Created/Updated admin user:', adminUser.email);

    // Create super admin user
    const superAdminUser = await prisma.user.upsert({
        where: { email: 'superadmin@company.com' },
        update: { role: 'SUPER_ADMIN' },
        create: {
            email: 'superadmin@company.com',
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            mfaEnabled: true,
        },
    });

    console.log('✅ Created/Updated super admin user:', superAdminUser.email);

    // Create standard user
    const standardUser = await prisma.user.upsert({
        where: { email: 'user@company.com' },
        update: { role: 'USER' },
        create: {
            email: 'user@company.com',
            name: 'Standard User',
            role: 'USER',
            mfaEnabled: false,
        },
    });

    console.log('✅ Created/Updated standard user:', standardUser.email);

    // Create sample integrations
    const integrations = [
        {
            name: 'Google Workspace',
            type: 'google',
            enabled: true,
            config: {
                configured: false,
                description: 'Google Workspace Admin SDK integration',
            },
        },
        {
            name: 'Slack',
            type: 'slack',
            enabled: true,
            config: {
                configured: false,
                description: 'Slack workspace integration',
            },
        },
        {
            name: 'Okta',
            type: 'okta',
            enabled: false,
            config: {
                configured: false,
                description: 'Okta identity management',
            },
        },
        {
            name: 'Microsoft 365',
            type: 'microsoft',
            enabled: false,
            config: {
                configured: false,
                description: 'Microsoft 365 integration',
            },
        },
        {
            name: 'Snipe-IT',
            type: 'snipeit',
            enabled: true,
            config: {
                configured: false,
                description: 'Asset management system',
            },
        },
        {
            name: 'HRMS',
            type: 'hrms',
            enabled: true,
            config: {
                configured: false,
                description: 'HRMS webhook integration',
            },
        },
    ];

    for (const integration of integrations) {
        await prisma.integration.upsert({
            where: { name: integration.name },
            update: {},
            create: integration,
        });
    }

    console.log('✅ Created integrations');

    // Create sample employee
    const sampleEmployee = await prisma.employee.upsert({
        where: { email: 'john.doe@company.com' },
        update: {},
        create: {
            employeeId: 'EMP001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@company.com',
            personalEmail: 'john.doe@gmail.com',
            phone: '+1-555-0123',
            department: 'Engineering',
            jobTitle: 'Senior Software Engineer',
            manager: 'Jane Smith',
            startDate: new Date('2024-01-15'),
            employeeType: 'Full-Time',
            location: 'San Francisco',
            status: 'ACTIVE',
            laptopRequired: true,
            laptopType: 'MacBook Pro 16"',
            laptopConfig: 'M3 Max, 64GB RAM, 2TB SSD',
            googleOrgUnit: '/Engineering',
            slackMemberType: 'MEMBER',
        },
    });

    console.log('✅ Created sample employee:', sampleEmployee.email);

    // Create sample onboarding record
    await prisma.onboardingRecord.create({
        data: {
            employeeId: sampleEmployee.id,
            source: 'Manual',
            status: 'COMPLETED',
            googleCreated: true,
            slackAdded: true,
            oktaCreated: false,
            microsoftCreated: false,
            snipeitCreated: true,
            initiatedBy: 'admin@company.com',
            completedAt: new Date(),
        },
    });

    console.log('✅ Created sample onboarding record');

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
