# OneIT - Employee Onboarding & Offboarding Platform

A comprehensive, automated employee lifecycle management system for IT administrators. OneIT streamlines onboarding and offboarding processes across multiple platforms including Google Workspace, Slack, Okta, Microsoft 365, and asset management systems.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.19-2D3748)

## 🚀 Features

### Core Functionality
- **Automated Onboarding**: Create accounts across all integrated platforms with a single click
- **Automated Offboarding**: Deactivate accounts and manage asset collection workflows
- **Bulk Operations**: Process multiple employees simultaneously
- **HRMS Integration**: Webhook-based automation triggered by HRMS events
- **Asset Management**: Track laptops and equipment with Snipe-IT integration
- **Audit Logging**: Complete audit trail of all operations

### Platform Integrations
- ✅ **Google Workspace** - User provisioning with OU placement
- ✅ **Slack** - Member/guest invitations with channel management
- ✅ **Okta** - Identity management
- ✅ **Microsoft 365** - User account creation
- ✅ **Snipe-IT** - Asset tracking and assignment
- ✅ **Jira** - Automated ticket creation for asset collection

### Advanced Features
- **Google Workspace OU Selection**: Place users in specific organizational units
- **Slack Channel Configuration**: Full member, single-channel, or multi-channel guest access
- **Security Policies**: MFA requirements, password policies, session timeouts, IP whitelisting
- **Role-Based Access Control**: Admin and user roles with granular permissions
- **AI Assistant**: Built-in chat assistant for IT support queries

## 🛠️ Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI**: React with Tailwind CSS, Framer Motion
- **Validation**: Zod
- **AI**: Vercel AI SDK with OpenAI

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Prisma Postgres)
- API credentials for integrations you want to use

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/oneit.git
cd oneit
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required Variables:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/oneit"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Set Up Database

```bash
# Push schema to database
npx prisma db push

# Seed initial data
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📚 API Documentation

### Employees
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Soft delete employee

### Onboarding/Offboarding
- `POST /api/onboarding` - Start onboarding workflow
- `POST /api/offboarding` - Start offboarding workflow
- `GET /api/onboarding/:id` - Get onboarding status
- `GET /api/offboarding/:id` - Get offboarding status

### Integrations
- `GET /api/integrations` - List all integrations
- `PUT /api/integrations/:id` - Update integration (admin only)

### Security
- `GET /api/security-policies` - Get security policies
- `PUT /api/security-policies` - Update policies (admin only)
- `GET /api/audit-logs` - View audit logs with filtering

## 🔒 Security

- **Authentication**: NextAuth.js with multiple providers
- **Authorization**: Role-based access control (RBAC)
- **Validation**: Zod schemas for all API inputs
- **Audit Logging**: All operations logged
- **Security Policies**: Configurable MFA, password requirements, session timeouts

## 📦 Project Structure

```
employee-onboarding/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── assets/            # Asset management
│   ├── onboarding/        # Onboarding pages
│   ├── offboarding/       # Offboarding pages
│   └── settings/          # Settings pages
├── components/            # React components
├── lib/                   # Utility libraries
├── prisma/               # Database schema
├── services/             # External integrations
└── public/               # Static assets
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

Built with Next.js, Prisma, and modern web technologies.

---

**Made with ❤️ for IT Teams**
