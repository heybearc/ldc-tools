# Changelog

All notable changes to LDC Tools will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.35.0] - 2026-10-30

### Added
- A process checklist for this construction group
- Starting a process puts each step on the work list
- Personnel has its own directory card, separate from the construction group

## [1.34.0] - 2026-10-30

### Added
- Dated work on a project, added by Personnel
- The same date shows on the project schedule and on the work list

## [1.33.0] - 2026-10-29

### Added
- Projects list for the signed-in construction group
- Oversight can assign and remove Personnel on a project
- Opening a project returns to that list

## [1.32.0] - 2026-10-29

### Added
- Work list for the signed-in construction group
- Personnel can add a task, assign it, and mark it done
- A claimable task can be claimed by anyone signed in to that group
- Each row shows a deadline, a project date, or a monthly or yearly repeat

## [1.31.0] - 2026-10-29

### Added
- Directory groups for construction group contacts (Contact, Assistant, Support) and ancillary region roles, scoped to the signed-in construction group
- Those people are included in directory search and CSV export

### Changed
- Removed the admin organization hierarchy editor. Signed-in users stay associated with their construction group.

### Fixed
- Profile save accepts an existing directory photo path, so a name-only save no longer returns "Choose an image file"

## [1.3.0] - 2024-12-16

### Added
- **Multi-Tenant Organization Hierarchy**
  - New Prisma models: Branch, Zone, Region, ConstructionGroup, ProjectStaffingRequest
  - Added constructionGroupId to User, TradeTeam, Crew, Project models
  - Seed script for initial hierarchy (US Branch, 5 Zones, Region 01.12, default CG)
  - CG scope utilities (getCGScope, withCGFilter) for data isolation
  - Organization admin page with expandable tree view
  - Hierarchy API route (/api/v1/admin/hierarchy)
  - Region creation API (/api/v1/admin/hierarchy/regions)
  - Construction Group creation API (/api/v1/admin/hierarchy/construction-groups)

- **Hierarchy Management UI**
  - Organization page in Admin sidebar
  - Access level indicator (Full Branch, Zone Level, CG Access)
  - Add Region button for SUPER_ADMIN users
  - Add Construction Group button for SUPER_ADMIN users
  - Auto-expanding tree for zones/regions with data
  - Stats overview (Branches, Zones, Regions, CGs counts)

### Changed
- **Simplified User Permissions Model**
  - Removed adminLevel field from User interface
  - Role now controls all access permissions
  - Added SUPER_ADMIN to top of role dropdown
  - Added READ_ONLY to bottom of role dropdown
  - Removed Admin Level selector from Invite, Create, and Edit user modals

- **Users API**
  - Updated to apply CG scoping based on user role
  - SUPER_ADMIN sees all users
  - Zone Overseer sees users in their zone
  - CG users see only users in their CG

### Technical
- Database schema updated with multi-tenant models
- Used `prisma db push` for schema sync
- CG naming convention: "CG 01.12" format

## [1.2.0] - 2024-12-16

### Added
- **Feedback System**
  - User feedback submission page
  - Admin feedback management page
  - Feedback API routes for submission and management
  - Prisma models: Feedback, FeedbackAttachment, FeedbackComment
  - Feedback link in footer on all pages
  - Feedback Management in Admin Control Center sidebar

- **Comprehensive Help Center Documentation**
  - Trade Teams help page with crew and member management guides
  - Projects help page with status overview and team assignments
  - Volunteers help page with search, import/export instructions
  - Admin Panel help page covering all admin modules
  - Troubleshooting help page with common issues and solutions
  - FAQ sections on all help pages

- **Redesigned Admin Dashboard**
  - Overview stats cards (Users, Feedback, System Health)
  - Recent Activity section with audit log preview
  - Admin Modules navigation grid
  - Environment indicator for GREEN/BLUE/PRODUCTION
  - Removed redundant CSV import and role management (moved to proper locations)

- **User Auto-Activation**
  - Users automatically activated on first successful login
  - INVITED users can now log in (only INACTIVE users blocked)
  - emailVerified timestamp set on first login

### Changed
- Help Center now shows all topics to all users (removed role filtering)
- Added Send Feedback button to Help Center footer section
- User status now computed from emailVerified field for consistency
- Admin can change user status which properly updates emailVerified

### Fixed
- Help topics not displaying for users with non-standard roles
- User Management "Invited" filter not showing users
- Admin unable to change user status to Active
- Status display inconsistency between stats and user list

## [1.1.0] - 2025-12-15

### Added
- **Real Audit Logging System**
  - AuditLog Prisma model for database storage
  - Audit utility functions (`frontend/src/lib/audit.ts`)
  - Audit logs API endpoint (`/api/v1/admin/audit/logs`)
  - Integration with NextAuth signIn/signOut events
  - User management actions logged (update, delete)

- **Data Protection with TrueNAS Backups**
  - Backup API endpoints (`/api/v1/admin/backup` and `/api/v1/admin/backup/info`)
  - Backup script on database server (`/usr/local/bin/backup-ldc-tools.sh`)
  - Daily automated backups at 2 AM via cron
  - Backups stored at `/mnt/data/ldc-tools-backups/database/automated/`
  - Rolling 30-backup retention policy

- **API Auto-Testing**
  - API Status page auto-tests all endpoints on load
  - Client-side testing with pending status indicators

### Changed
- **System Operations Page Redesign**
  - Changed from horizontal grid to vertical list layout
  - Removed old Database Backup operation (replaced by Data Protection)
  - Professional table-like format with status, last run, and actions

- **Admin UI Cleanup**
  - Removed NextAuth v4 tag from admin header
  - Removed Security info box from admin sidebar

### Fixed
- Audit logs API route deployment (was ignored by .gitignore)
- Audit logs fetch missing credentials
- Backup API SSH host key verification
- Backup API admin authentication check

## [1.0.0] - 2025-11-01

### 🎉 Major Release: NextAuth v4 Migration

This is the first stable release of LDC Tools with production-ready authentication.

### Added
- **NextAuth v4 Authentication System**
  - Database-backed authentication with Prisma
  - JWT session tokens (24-hour expiry)
  - Secure password hashing with bcrypt
  - Proper session management
  - Login tracking (lastLogin, loginCount)
  
- **Infrastructure Improvements**
  - Blue-Green deployment setup
  - Container naming: `ldctools-blue` (Container 133) and `ldctools-green` (Container 135)
  - MCP server integration for deployment automation
  - Updated SSH shortcuts for new hostnames

### Changed
- **Application Renamed**: "LDC Construction Tools" → "LDC Tools"
  - Updated all UI references
  - Updated package.json and documentation
  - Simplified branding across the application

- **Authentication Overhaul**
  - Replaced custom WMACS authentication with NextAuth v4
  - Removed hardcoded credentials
  - Migrated from custom session cookies to JWT tokens
  - Updated middleware to use NextAuth session tokens

### Removed
- **WMACS Authentication System** (deprecated)
  - Removed `frontend/src/lib/auth.ts` (hardcoded credentials)
  - Removed `frontend/src/app/api/auth/signin/route.ts` (custom signin API)
  - Removed old session cookie management
  - Cleaned up WMACS references in UI

### Security
- ✅ No more hardcoded passwords in source code
- ✅ Database-backed user authentication
- ✅ Bcrypt password hashing (10 rounds)
- ✅ JWT session tokens with secure httpOnly cookies
- ✅ Proper session expiration handling

### Database
- PostgreSQL database: `ldc_tools` on Container 131 (10.92.3.21)
- NextAuth tables: Account, Session, User, VerificationToken
- User table includes role, regionId, zoneId for RBAC

### Deployment
- **BLUE Environment**: https://blue.ldctools.cloudigan.net (Container 133)
- **GREEN Environment**: https://green.ldctools.cloudigan.net (Container 135)
- Feature branch: `feature/app-rename-and-nextauth-v4`

### Migration Notes
- Existing users must use database credentials (no more hardcoded auth)
- Default admin user: `admin@ldctools.local`
- Sessions from old WMACS auth will be invalidated
- Users need to log in again after upgrade

---

## [0.1.0] - 2025-10-27

### Initial Development Release
- Basic application structure
- WMACS authentication (deprecated)
- Trade teams management
- Role management system
- Admin control panel
- Volunteer management
- Project management

---

## Version History

- **v1.0.0** (2025-11-01) - NextAuth v4 Migration & Production Ready
- **v0.1.0** (2025-10-27) - Initial Development Release
