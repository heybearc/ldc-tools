# LDC Construction Tools

Personnel Contact assistance system for LDC Construction Groups.

## Version
Current: **1.49.0**

## Version History
- **v1.49.0** (2026-11-11) - Process templates stay drafts until published, with a schedule and a choice of standalone or project
- **v1.48.8** (2026-11-11) - Completion email follows the selection, chat lists everyone, and project assignment lists every Personnel person
- **v1.48.7** (2026-11-11) - Phone numbers use one format, (555) 555-5555
- **v1.48.6** (2026-11-11) - Select several accounts, invite someone who has not finished setup, and add a person to Personnel
- **v1.48.5** (2026-11-11) - Creating an account uses platform access
- **v1.48.4** (2026-11-10) - The sign-in logo shows again
- **v1.48.3** (2026-11-08) - Each phone screen is checked before release
- **v1.48.2** (2026-11-08) - Release tests no longer mail fake addresses, and the phone lets the same people add a project or trade team as the website
- **v1.48.1** (2026-11-08) - Branded sign-in, the accounts list, a project save confirmation, and marking a chat unread
- **v1.48.0** (2026-11-08) - Phone alerts, and processes, projects, and trade teams in the phone app
- **v1.47.0** (2026-11-05) - Invite-only privacy and support pages, account deletion, and chat report and block
- **v1.46.2** (2026-11-04) - Password reset and test emails send with the saved mailbox password
- **v1.46.1** (2026-11-04) - The phone app icon and launch image are centered
- **v1.46.0** (2026-11-03) - Edit a project, see its dates on a calendar, and open Projects in the phone app
- **v1.45.1** (2026-11-03) - Chat notifications show Turn off when they are already on
- **v1.45.0** (2026-11-03) - Open claimed work, check steps, and chat in the phone app
- **v1.44.0** (2026-11-03) - Claim work in the app, and open a person from the directory
- **v1.43.0** (2026-10-31) - Tablet layout in the app, and clearer messages when something fails
- **v1.42.0** (2026-10-30) - Phone layout, and a new trade or crew person is not a sign-in account
- **v1.41.0** (2026-10-30) - Team chat, My Work, help replies, and finishing several tasks
- **v1.40.0** (2026-10-30) - Tasks can have no deadline, and several can be assigned at once
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
- Assigned tasks are on My Work
- Several open tasks can be marked done together
- Help requests can be answered on the task

### Processes
- A template stays a draft until someone publishes it
- The schedule can be one time, daily, weekly, every two weeks, monthly, quarterly, yearly, or a custom interval
- A published template is standalone, or it is added to a project
- Starting it adds one work item, and the tasks stay inside that item

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
- Team chat and a direct message for this construction group
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
