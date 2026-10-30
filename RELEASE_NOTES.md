# LDC Tools Release Notes

## v1.37.0 - Directory profiles and user corrections

**Release Date:** October 30, 2026

### ✨ New Features

- Open a profile from a construction group, Personnel, or ancillary name
- Change a user's name or email
- Cancel an invitation that has not been accepted

### 🐛 Bug Fixes

- The user actions menu stays on screen

## v1.36.0 - Construction group access

**Release Date:** October 30, 2026

### ✨ New Features

- Add a project for this construction group

### 🐛 Bug Fixes

- Admin opens the Admin Control Center
- User management lists the Personnel team for this region
- Work and Projects open for Personnel and a super admin in their construction group

## v1.35.0 - Processes and Personnel

**Release Date:** October 30, 2026

### ✨ New Features

- Save a process for this construction group and start it
- Each step shows up on the work list
- Personnel has its own card on the directory
- Sign-in opens the dashboard

## v1.34.0 - Project dates

**Release Date:** October 30, 2026

### ✨ New Features

- Personnel can add dated work on a project
- That date stays on the project and also shows on the work list

## v1.33.0 - Projects

**Release Date:** October 29, 2026

### ✨ New Features

- A projects list for this construction group
- Oversight assigns Personnel to a project
- Crews, budget, and congregations stay off this list

## v1.32.0 - Work list

**Release Date:** October 29, 2026

### ✨ New Features

- A work list for this construction group
- Personnel can add a task and assign it
- A claimable task can be taken by anyone signed in here
- Each row shows a deadline, a project date, or a monthly or yearly repeat

## v1.31.0 - Construction group people on the directory

**Release Date:** October 29, 2026

### ✨ New Features

- Construction group contacts and ancillary region people are listed on the directory with the trades
- Saving a person keeps the existing photo unless you reposition it

### 🔧 Improvements

- The admin hierarchy editor is removed. People belong to the construction group where they serve.

## v1.30.0 - Place a profile photo and open a trade team

**Release Date:** October 28, 2026

### ✨ New Features

- Drag a profile photo into the circle, then save that crop
- Open a trade team to see its crews and oversight
- The home page is the trade leadership directory

## v1.29.0 - Move people and keep sisters in Support

**Release Date:** October 27, 2026

### ✨ New Features

- Move a person to another trade, crew, or role from the directory
- Sisters can only be Support

## v1.22.2 - UI Modernization & Admin Dashboard Fix

**Release Date:** December 29, 2025  
**Status:** Ready for Production ✅

### 🎨 UI Improvements

**Modern Help Center Design**
- Redesigned Help Center and all help pages with modern blue gradient design
- Improved navigation with hover effects and better readability
- Consistent design across all help pages matching main app style

**Modern Release Notes Page**
- Clean, card-based layout for release entries
- Better visual hierarchy with gradient accents
- Easier to read and navigate

**Correct Logo Display**
- Fixed logo display in help pages to show proper LDC Tools logo
- Consistent branding throughout the application

### 🐛 Bug Fixes

**Admin Dashboard Timestamps**
- Fixed "NaNd ago" display issue in Recent Activity section
- Timestamps now properly show "Just now", "5m ago", "2h ago", etc.
- Accurate activity tracking for administrators

### 📝 Technical Details

**Files Modified:**
- HelpLayout component - Modern gradient design with correct logo
- Release notes page - Card-based modern layout
- Admin dashboard - Fixed timestamp field mapping

---

## v1.22.1 - Permission Fixes & Code Cleanup

**Release Date:** December 28, 2025  
**Status:** Ready for Production ✅

### 🐛 Bug Fixes

**Feedback Comment Permissions**
- Fixed: Feedback submitters can now respond to admin comments on their own submissions
- Admins (ADMIN/SUPER_ADMIN) can respond to any feedback
- READ_ONLY_ADMIN users cannot add comments (view only)
- Permission system now based on system roles only

**Crew Request Delete Permission**
- Fixed: Personnel Support (PC-Support) role users can now delete crew requests
- Corrected role code from PC_SUPPORT to PC-Support (hyphen instead of underscore)

**Release Notes Display**
- Fixed: v1.22.0 release notes now display correctly on /release-notes page
- Added proper frontmatter metadata to release notes files

### 🧹 Code Cleanup

**Removed Duplicate Files**
- Removed duplicate /release-notes/ directory (root level)
- Removed unused /frontend/RELEASE_NOTES.md file
- Cleaner codebase structure

### 📝 Technical Details

**Files Modified:**
- Feedback comment API route - Updated permission logic
- Crew request delete API route - Fixed role code
- Release notes files - Added frontmatter and proper structure

---

## v1.22.0 - Complete Mobile Optimization

**Release Date:** December 28, 2025  
**Status:** Ready for Production ✅

### 📱 New Features

**Complete Mobile & Tablet Support**
- Full mobile responsiveness across entire application
- Touch-friendly controls (44px minimum tap targets)
- Responsive layouts for all pages (Dashboard, Volunteers, Projects, Trade Teams, Crew Requests)
- Mobile-optimized admin pages (User Management, Announcements, Feedback, Organization)
- Hamburger menus for mobile navigation
- Horizontal scrolling for wide tables
- Icon-only buttons on small screens

**Smart Release Announcements**
- Release banner now dynamically pulls highlights from RELEASE_NOTES.md
- Automatically shows latest feature for each new version
- No more static announcement text

### 🧹 Technical Improvements

**Code Cleanup**
- Removed 4,669 lines of unused FastAPI backend code
- Consolidated 3 .env files into single .env.local
- Simplified configuration management
- Improved build performance

**Infrastructure**
- Expanded container disk space from 10GB to 20GB
- Fixed Prisma client synchronization
- Improved deployment reliability

### 📝 Technical Details

**Mobile Optimization Coverage:**
- All navigation components responsive
- Global mobile CSS utilities added
- Consistent touch-friendly sizing throughout
- Responsive grids (1-2 cols mobile, 4 cols desktop)
- Mobile sidebar patterns implemented

**Files Modified:**
- 15+ page components optimized for mobile
- Global CSS utilities added
- Admin layout with mobile drawer
- Dynamic release banner system

---

## v1.17.0 - Session Fix & Build Stability

**Release Date:** December 24, 2025  
**Status:** Ready for Production ✅

### 🐛 Critical Bug Fixes

**Session Authentication Fix**
- ✅ Fixed `volunteerId` missing from NextAuth session
- ✅ Added volunteerId to authorize callback, JWT token, and session object
- ✅ Crew request authorization now works for Personnel Contact roles
- ✅ Users must re-login after deployment for fix to take effect

**Build Stability Fix**
- ✅ Fixed missing `_error.js` causing 500 errors
- ✅ Cleaned and rebuilt Next.js application
- ✅ Resolved error page rendering issues

### 📝 Technical Details

**Auth Configuration Updates:**
- Added `volunteerId` to `auth-config.ts` in 3 locations:
  - Line 75: authorize() return object
  - Line 101: jwt() callback token
  - Line 114: session() callback user object

**Impact:**
- Personnel Contact roles (PC, PCA, PC-Support) can now submit crew requests on behalf of others
- Session now includes volunteerId for organizational role fetching
- Requires user re-login to get new session token with volunteerId

### ⚠️ Important Notes

**User Action Required:**
- All users must log out and log back in after deployment
- This updates their session token to include volunteerId
- Required for crew request authorization to work properly

---

## v1.16.0 - Crew Request Authorization Fix

**Release Date:** December 24, 2025  
**Status:** Deployed to STANDBY ✅

### 🎯 New Features

**Personnel Contact Role Authorization**
- ✅ Users with Personnel Contact organizational roles can submit crew requests on behalf of others
- ✅ Supports PC (Personnel Contact), PCA (Personnel Contact Assistant), PC-Support roles
- ✅ Maintains backward compatibility with SUPER_ADMIN role

### 🔧 Improvements

**Crew Request Submission**
- Fetches user's organizational roles from volunteer-roles API
- Checks for Personnel Contact role codes (PC, PCA, PC-Support)
- Shows "Submit on Behalf Of" section for authorized users
- Allows entering different requestor name/email for submissions

**Authorization Logic**
- Updated from old user.role field to organizational roles system
- Added userRoles state to track volunteer organizational roles
- Checks volunteerId in session to fetch roles
- Combines SUPER_ADMIN (legacy) OR Personnel Contact roles

### 🐛 Bug Fixes

- Fixed crew request authorization to use organizational roles instead of old user.role field
- Fixed Personnel Contact roles not being able to submit on behalf of others

### 📝 Technical Details

**Role Codes:**
- **PC** - Personnel Contact (Region Support Services)
- **PCA** - Personnel Contact Assistant (Region Support Services)
- **PC-Support** - Personnel Contact Support (Region Support Services)

**API Integration:**
- Fetches roles from `/api/v1/volunteer-roles?volunteerId={id}`
- Checks roleCode field for Personnel Contact roles
- Falls back to SUPER_ADMIN for legacy authorization

---

## v1.15.0 - Organizational Roles Enhancements

**Release Date:** December 24, 2025  
**Status:** Deployed to STANDBY ⚠️

### 🎯 New Features

**User-Volunteer Linking**
- ✅ Bidirectional linking between User and Volunteer records
- ✅ Blue "User" badge on Volunteers page (grid and table views)
- ✅ Purple "Volunteer" badge on Users page
- ✅ Link persistence across edit operations
- ✅ User account linking in AddVolunteerModal

**Bulk Import with Organizational Roles**
- ✅ CSV import creates VolunteerRole records automatically
- ✅ Legacy role name mapping (Trade Team Overseer → TTO, etc.)
- ✅ Backward compatibility with old CSV format
- ✅ Multiple roles per volunteer support
- ✅ Proper entityType and entityId assignment

### 🔧 Improvements

**AddVolunteerModal Rebuild**
- Removed legacy role dropdown
- Added VolunteerRoleAssignment component integration
- Added user account linking dropdown
- Professional multi-step workflow (create → assign roles → done)
- Clean UI transitions between form and role assignment

**API Updates**
- Fixed volunteer creation to exclude legacy role fields
- Updated Users API to return volunteerId for badge display
- Fixed volunteer list and detail APIs for user linking
- Removed role, isOverseer, isAssistant from creation payload

### 🐛 Bug Fixes

- Fixed "failed to create volunteer" error (removed legacy role field)
- Fixed volunteer creation API to use organizational roles only
- Fixed Users API to include volunteerId in response
- Fixed volunteer GET endpoints to return user.id correctly

### ⚠️ Known Issues

**AddVolunteerModal Role Assignment UI**
- Modal does not transition to role assignment view after volunteer creation
- State is set correctly (console logs confirm) but UI doesn't update
- Workaround: Edit volunteer to assign organizational roles
- Issue: useEffect or React state batching preventing UI re-render
- Status: Deferred for future fix

### 📝 Notes

This release completes the organizational roles migration for volunteer management:
- ✅ All volunteer creation uses organizational roles
- ✅ Bulk import supports new roles system
- ✅ User-volunteer linking fully operational
- ⚠️ AddVolunteerModal UI issue requires manual role assignment via edit

---

## v1.14.0 - Organizational Role Management System

**Release Date:** December 24, 2025  
**Status:** Production Ready ✅

### 🎉 Major Features

**Complete Multi-Role Organizational Structure**
- ✅ Volunteers can have multiple organizational roles simultaneously
- ✅ Primary role designation with visual indicators (★)
- ✅ 192 distinct role positions across all organizational levels
- ✅ Hierarchical role structure (CG → Trade Team → Trade Crew)

### ✨ New Features

**Phone Number Formatting**
- Real-time phone number formatting as user types
- Standard US format: (XXX) XXX-XXXX
- Applied to all volunteer phone input fields

**Multi-Role Assignment System**
- Real-time role updates in volunteer modal
- "Make Primary" button to change primary role without re-assignment
- Role cards display actual team/crew names

**Trade Team/Crew Role Integration**
- Automatic team/crew selection when assigning roles
- Cascading dropdowns (Trade Team → Trade Crew)
- Automatic volunteer assignment to selected team/crew

**Enhanced Volunteers List**
- New "Trade Team/Crew" column showing assignments
- Displays team name for trade team roles
- Displays team + crew name for crew roles

**Dashboard Integration**
- Crew detail pages display volunteers with organizational roles
- Trade team dashboard uses organizational roles for counting
- Accurate member counts and TCO requirements

### 🔧 Technical Improvements

**Database Schema**
- Added `tradeTeamId` and `crewId` fields to `VolunteerRole` table
- Proper foreign key relations to TradeTeam and Crew tables
- Bidirectional relations for efficient querying

**API Enhancements**
- Volunteers API includes roles with team/crew IDs
- Trade teams API uses organizational roles for counting
- All endpoints properly return role data with relations

### 🐛 Bug Fixes

- Fixed clicking "Save Changes" overwriting team/crew assignments
- Fixed crew detail pages not displaying volunteers with organizational roles
- Fixed trade team dashboard showing incorrect member counts
- Fixed "crews needing TCO" count using legacy flags
- Fixed role cards reverting to generic labels

---

## v1.12.0 - User Invitation System

**Release Date:** December 23, 2025  
**Status:** Production Ready ✅

### 🎯 New Features

**User Invitation System**
- ✅ Send email invitations to new users
- ✅ Resend invitations to users who haven't accepted
- ✅ Professional email templates with 7-day expiration
- ✅ Invitation acceptance flow with password setup
- ✅ Automatic user activation upon acceptance
- ✅ Invitation tracking and status management

**Crew Request Management**
- ✅ Delete crew requests (SUPER_ADMIN only)
- ✅ Trash icon for easy request deletion

### 🔧 Improvements

**Invitation System**
- All invitation links use production URL (ldctools.com)
- Proper UserInvitation table integration
- Invitation status tracking (PENDING, ACCEPTED)
- Email sent confirmation and tracking

**User Management**
- Invited users appear immediately in user list
- Resend invitation option in user actions dropdown
- Better status indicators (INVITED, ACTIVE, INACTIVE)

### 🐛 Bug Fixes

- Fixed invitation acceptance "Invalid Invitation" error
- Fixed invitation email links to always use production URL
- Fixed User record creation on invitation
- Fixed invitation verification using UserInvitation table
- Fixed email configuration null handling

---

## v1.11.0 - Secondary Role System

**Release Date:** December 2025  
**Status:** Production Ready 🎉

### 🎯 New Features

**Secondary Role System (ldcRole)**
- Organizational roles separate from system roles
- Personnel Contact roles can assign crew requests to themselves
- Better role-based filtering and permissions

**Crew Request Improvements**
- Assignment dropdown shows all eligible users
- Email notifications on request completion
- Visual status indicators
- Multi-volunteer batch requests

### 🔧 Improvements

- Construction Group dropdown in user management
- Better API response transformation
- Improved crew request workflow

---

## v1.0.0 - Initial Release

**Release Date:** November 1, 2025  
**Status:** Production Ready 🎉

---

## 🎯 What's New

### NextAuth v4 Authentication
LDC Tools now uses industry-standard NextAuth v4 for secure, database-backed authentication.

**Key Features:**
- ✅ Secure password hashing with bcrypt
- ✅ JWT session tokens (24-hour expiry)
- ✅ Database-backed user management
- ✅ Login tracking and audit trail
- ✅ Role-based access control (RBAC)

### Application Rebranding
- **New Name:** LDC Tools (simplified from "LDC Construction Tools")
- **Updated UI:** Cleaner, more modern interface
- **Better UX:** Streamlined navigation and user experience

### Infrastructure Improvements
- **Blue-Green Deployment:** Zero-downtime deployments
- **Container Naming:** `ldctools-blue` and `ldctools-green`
- **MCP Integration:** Automated deployment management

---

## 🔐 Security Enhancements

### What Changed
1. **No More Hardcoded Credentials**
   - Old system had hardcoded passwords in source code
   - New system uses database-backed authentication

2. **Stronger Password Security**
   - Bcrypt hashing with 10 rounds
   - Passwords never stored in plain text

3. **Better Session Management**
   - JWT tokens instead of custom cookies
   - Automatic session expiration
   - Secure httpOnly cookies

---

## 📦 What Was Removed

### WMACS Authentication (Deprecated)
The custom WMACS authentication system has been completely removed and replaced with NextAuth v4.

**Removed Files:**
- `frontend/src/lib/auth.ts`
- `frontend/src/app/api/auth/signin/route.ts`
- Custom session cookie management

**Why?**
- Hardcoded credentials were a security risk
- Custom auth was harder to maintain
- NextAuth v4 is industry-standard and battle-tested

---

## 🚀 Deployment Information

### Environments

**BLUE (Staging/Testing)**
- URL: https://blue.ldctools.cloudigan.net
- Container: 133 (ldctools-blue)
- IP: 10.92.3.23

**GREEN (Production)**
- URL: https://green.ldctools.cloudigan.net
- Container: 135 (ldctools-green)
- IP: 10.92.3.25

**Database**
- PostgreSQL on Container 131
- IP: 10.92.3.21
- Database: `ldc_tools`

---

## 👤 User Information

### Default Admin Account
- **Email:** `admin@ldctools.local`
- **Password:** Contact your system administrator

### First-Time Login
1. Navigate to the login page
2. Enter your email and password
3. You'll be redirected to the dashboard
4. Session lasts 24 hours

### Password Requirements
- Minimum 8 characters
- Must be stored securely in database
- Contact admin for password resets

---

## 🔄 Migration Guide

### For Existing Users

**Important:** Old WMACS sessions will not work after this upgrade.

**Steps:**
1. Clear your browser cookies
2. Navigate to the login page
3. Log in with your database credentials
4. Your session will be valid for 24 hours

### For Administrators

**Database Setup:**
- Ensure PostgreSQL is running on Container 131
- Database `ldc_tools` must exist
- User `ldc_user` must have proper permissions

**Environment Variables:**
```bash
DATABASE_URL="postgresql://ldc_user:ldc_password@10.92.3.21:5432/ldc_tools"
NEXTAUTH_URL="https://blue.ldctools.cloudigan.net"
NEXTAUTH_SECRET="your-secret-here"
NODE_ENV="production"
```

---

## 🐛 Known Issues

None at this time. This is a stable release.

---

## 📚 Documentation

### Updated Documentation
- [README.md](./README.md) - Project overview
- [CHANGELOG.md](./CHANGELOG.md) - Detailed change history
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide

### Help & Support
- Check the admin panel for system status
- Review logs in PM2: `pm2 logs ldc-production`
- Database issues: Check Container 131 PostgreSQL

---

## 🎯 Next Steps

### Recommended Actions
1. **Test on BLUE first** - Always test changes on the blue environment
2. **Monitor logs** - Watch PM2 logs for any issues
3. **Backup database** - Regular backups of PostgreSQL
4. **Update passwords** - Ensure all users have secure passwords

### Future Enhancements
- Email-based password reset
- Two-factor authentication (2FA)
- OAuth providers (Google, Microsoft)
- User invitation system
- Advanced audit logging

---

## 📞 Support

For issues or questions:
1. Check the [CHANGELOG.md](./CHANGELOG.md) for known issues
2. Review PM2 logs: `pm2 logs ldc-production`
3. Check database connectivity
4. Contact your system administrator

---

**Thank you for using LDC Tools v1.0.0!** 🎉
