# Implementation Plan - LDC Tools

**Last Updated:** 2026-04-28  
**Current Phase:** Release reliability hardening (post-v1.27.4)

---

## 🎯 Active Work (This Week)

**Current Focus:** Stabilize deployment/test-release workflow and MCP LIVE/STANDBY status fidelity after v1.27.4 release

- [ ] Fix MCP `get_deployment_status` parsing for ldc-tools (`backend: unknown` misreport) (effort: S)
- [ ] Validate end-to-end MCP release workflow against HAProxy truth source (effort: S)
- [ ] Plan Phase 4 features and timeline (effort: S)

---

## 📋 Backlog (Prioritized)

### High Priority
- [ ] Rework admin portal to match TheoShift approach (effort: XL) - Redesign admin interface to follow TheoShift's admin portal patterns for consistency across applications
- [ ] Mobile optimization and PWA support (effort: L) - Optimize application for mobile devices and implement Progressive Web App capabilities for offline support and app-like experience
- [ ] Fix TypeScript error in ImportExportButtons.tsx (lines 52, 184) (effort: S) - Pre-existing error, non-blocking but should be fixed

### Medium Priority
- [ ] SSH alias configuration improvement (effort: S) - Consider renaming ldc-staging/ldc-prod to match color-based naming (documented in control plane)
- [ ] Enhanced error messages across application (effort: M) - Improve user-facing error clarity
- [ ] Additional validation rules (effort: M) - Add comprehensive input validation
- [ ] Resolve Playwright reporter output folder overlap warning on qa-01 (effort: S)

### Low Priority
- [ ] Performance optimizations for large datasets (effort: L) - Improve query performance for projects with many crew requests
- [ ] Improved caching strategies (effort: M) - Reduce database queries with strategic caching
- [ ] Code quality improvements (effort: M) - Address TypeScript lint warnings, replace console.log with proper logging

---

## 🐛 Known Bugs

### Critical (Fix Immediately)
None currently identified.

### Non-Critical (Backlog)
- [ ] TypeScript error in ImportExportButtons.tsx (lines 52, 184) (effort: S) - Pre-existing, non-blocking
- [ ] MCP ldc-tools status endpoint can report stale LIVE/STANDBY (`backend: unknown`) (effort: S)

---

## 💡 User Feedback & Feature Requests

### Active Feedback Items (From Production System)
- [x] "Ability to respond in feedback request" (RESOLVED) - Fixed and verified in production records
- [x] "Using my name as requestor" (RESOLVED) - Fixed and verified in production records

### From Users
- [ ] Role code mismatch handling improvement (effort: S) - v1.27.2 fixed PC_SUPPORT vs PC-Support, but could add better validation
- [ ] Whitespace trimming for spreadsheet imports (effort: S) - v1.27.2 added this, working well

### From App (Analytics/Observations)
- [ ] FastAPI backend documentation debt (effort: S) - Backend was intentionally removed in v1.18.0, docs should reflect this
- [ ] Application architecture clarity (effort: S) - Document that app is Next.js-only with API routes + Prisma ORM

---

## 🗺️ Roadmap (Strategic)

### Q1 2026 (Jan-Mar)
- [x] Phase 1: Multi-Tenant Architecture - COMPLETE
- [x] Phase 2: CG Management & Audit Logging - COMPLETE
- [x] Phase 3: Admin Module Enhancement - COMPLETE
- [ ] Phase 4: Role Management System - Planned (4-6 weeks)

### Q2 2026 (Apr-Jun)
- [ ] Email configuration system with Gmail/SMTP support
- [ ] User invitation system with email sending
- [ ] Health monitoring dashboard with real-time metrics
- [ ] API status monitor with endpoint testing
- [ ] System operations with backup management

### Future (No Timeline)
- [ ] Enhanced bulk operations (import/export improvements)
- [ ] Advanced reporting and analytics
- [ ] Integration with external construction management systems

---

## 📝 Deferred Items

**Items explicitly deferred with rationale:**

None currently.

---

## ✅ Recently Completed (Last 30 Days)

- [x] Release v1.27.4 completed (bump, release tag, traffic switch, standby sync) - Date: 2026-04-28 - Both blue/green verified on commit `1321bf6`
- [x] Fixed feedback submission outage - Date: 2026-04-28 - `feedbackNumber` now generated during submit; resolves 500 error in `/api/v1/feedback/submit`
- [x] Restored `/test-release` on qa-01 - Date: 2026-04-28 - Added `dotenv` for Playwright config and passed smoke tests 4/4
- [x] Updated ssh aliases for role-based naming - Date: 2026-04-28 - Added `ldctools-blue` and `ldctools-green` aliases
- [x] Governance sync - promoted 2 patterns to control plane - Date: 2026-02-16 - Release Notes UI/UX Best Practices and Feedback Status Transition Validation Pattern now available to all apps
- [x] Fixed CLOSED → RESOLVED status transition bug - Date: 2026-02-15 - Allows existing resolution comment to satisfy requirement, improves UX for admin users
- [x] D-024 Feedback Management Compliance - Date: 2026-02-15 - Added resolutionComment field to Feedback model, deployed migration to both containers, API already validates required field when marking feedback as RESOLVED
- [x] qa-01 testing infrastructure setup - Date: 2026-02-14 - Configured Playwright tests, fixed all test failures, achieved 100% pass rate (64/64 tests)
- [x] Password reset page and API endpoints - Date: 2026-02-14 - Created /auth/reset-password page with token verification and password reset functionality
- [x] Password reset 500 error fix - Date: 2026-02-12 - Fixed incorrect field names (smtpPassword→appPasswordEncrypted, smtpUser→username) and changed to use VerificationToken model instead of non-existent inviteToken fields
- [x] D-022 implementation plan standard migration - Date: 2026-02-02
- [x] Archived 15 planning files (BACKLOG, ROADMAP, phase docs) - Date: 2026-02-02
- [x] Created single IMPLEMENTATION-PLAN.md source of truth - Date: 2026-02-02
- [x] Governance sync with control plane - Date: 2026-02-02
- [x] v1.27.2 bug fix deployment (crew request submission) - Date: 2026-01-25
- [x] Fixed role code mismatch (PC_SUPPORT vs PC-Support) - Date: 2026-01-25
- [x] Added whitespace trimming for copy-paste from spreadsheets - Date: 2026-01-25
- [x] Infrastructure documentation promoted to control plane - Date: 2026-01-25
- [x] Repository branch cleanup (10 branches deleted) - Date: 2026-01-25
- [x] Complete repository rename (ldc-construction-tools → ldc-tools) - Date: 2026-01-25
- [x] Phase 3: Admin Module Enhancement - Date: 2026-01-12
- [x] Phase 2: CG Management & Audit Logging - Date: 2026-01-12

---

## 📊 Effort Sizing Guide

- **S (Small):** 1-4 hours - Quick fixes, minor tweaks
- **M (Medium):** 1-2 days - Standard features, moderate bugs
- **L (Large):** 3-5 days - Complex features, major refactoring
- **XL (Extra Large):** 1+ weeks - Major modules, architectural changes
