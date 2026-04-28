# LDC Construction Tools

Personnel Contact assistance system for LDC Construction Groups.

## Version
Current: **1.27.4**

## Version History
- **v1.27.4** (2026-04-28) - Fixed feedback submission reliability and qa-01 test runner setup

## Infrastructure

### Blue-Green Deployment
- **BLUE (STANDBY):** ldctools-blue (10.92.3.23) - https://blue.ldctools.com
- **GREEN (LIVE):** ldctools-green (10.92.3.25) - https://green.ldctools.com
- **Database:** Shared PostgreSQL (10.92.3.21)

## Features

### User Management
- User invitation system with email notifications
- Role-based access control (RBAC)
- Personnel Contact, Admin, and Overseer roles

### Trade Team Management
- Trade team and crew organization
- Volunteer assignment and tracking
- Crew change request workflow

### Communication
- Email configuration (Gmail/SMTP)
- Invitation emails with personalized greetings
- Crew request notifications

### Administration
- Construction Group management
- Organization hierarchy (Branch → Zone → Region → CG)
- System health monitoring
- Audit logging

## Development

### Setup
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
npm start
```

### Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for blue-green deployment process.

## Technology Stack
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- NextAuth.js
- Nodemailer

## Environment Variables
```
DATABASE_URL=postgresql://user:pass@10.92.3.21:5432/ldc_tools
NEXTAUTH_URL=https://blue.ldctools.com (or green)
NEXTAUTH_SECRET=<secret>
EMAIL_ENCRYPTION_KEY=<key>
```

## Documentation
- [Deployment Guide](./DEPLOYMENT.md)
- [Changelog](./CHANGELOG.md)

## Support
For issues or questions, use the Feedback system in the application.
