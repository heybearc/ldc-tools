# LDC Construction Tools

Personnel Contact assistance system for LDC Construction Groups.

## Version
Current: **1.39.0**

## Version History
- **v1.39.0** (2026-10-30) - Import a crew-update spreadsheet onto the work list
- **v1.38.1** (2026-10-30) - Resend an invitation email for someone who is already invited
- **v1.38.0** (2026-10-30) - Invite someone from User Management, and confirm actions with a notice
- **v1.37.0** (2026-10-30) - Open a profile from the directory, and correct a user name, email, or invitation
- **v1.36.0** (2026-10-30) - Stay in your construction group so Personnel can add work and projects
- **v1.35.0** (2026-10-30) - Start a process onto the work list, and give Personnel its own directory card
- **v1.34.0** (2026-10-30) - Dated work on a project also shows on the work list
- **v1.33.0** (2026-10-29) - Projects list for the construction group, with Personnel assigned by oversight
- **v1.32.0** (2026-10-29) - Work list for the construction group
- **v1.31.0** (2026-10-29) - Construction group contacts and ancillary people on the directory
- **v1.30.0** (2026-10-28) - Open a trade team, and place a profile photo in the circle before saving
- **v1.29.0** (2026-10-27) - Move people between trades and roles; sisters stay in Support
- **v1.28.0** (2026-10-27) - Trade Leadership Directory is the home page, with search, edit, and end dates
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

### Work
- Tasks for the signed-in construction group
- Personnel add and assign them
- Claimable tasks can be taken by anyone signed in to that group

### Processes
- A checklist saved for this construction group
- Starting it puts each step on the work list

### Directory
- Construction group, Personnel, and ancillary contacts sit above the trades
- Sign-in opens the dashboard

### Projects
- Projects for the signed-in construction group
- Oversight assigns Personnel to a project
- Personnel add a date on a project, and that date shows on the work list
- Crews, budget, and congregations stay off this list

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
