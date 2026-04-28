# LDC Tools Repo-Local Decisions

This file tracks decisions specific to working on the LDC Tools repo.

For shared architectural decisions that apply to all apps, see `.cloudy-work/_cloudy-ops/context/DECISIONS.md`.

---

## D-LDC-001: Container-first development
- **Decision:** All LDC Tools development occurs on containers (ldc-staging, ldc-prod)
- **Why:** Consistent environment, no local dependency conflicts
- **When:** Established as standard practice
- **Pattern:** Local Mac for Windsurf/git, containers for builds/tests/execution
- **Canonical path:** `/opt/ldc-tools/frontend`

## D-LDC-002: Blue-green deployment model
- **Decision:** Use blue-green containers for zero-downtime deployments
- **Why:** Allows testing on STANDBY before switching traffic
- **When:** Infrastructure established
- **Containers:** GREEN (135 - 10.92.3.25), BLUE (133 - 10.92.3.23)
- **Workflow:** Deploy to STANDBY → Test → Release (switch traffic) → Sync STANDBY
- **Critical:** ALWAYS use MCP server to identify current LIVE/STANDBY before deploying
- **Reference:** `.cloudy-work/_cloudy-ops/runbooks/deployment.md` for full workflow

## D-LDC-003: FastAPI backend was intentionally removed
- **Date:** 2026-01-25 (documented)
- **Context:** LDC Tools migrated from FastAPI backend to Next.js-only architecture in v1.18.0 (Sept 2025)
- **Decision:** Application is Next.js full-stack (API routes + Prisma ORM), no separate backend
- **Consequences:** All backend references in docs/scripts are obsolete technical debt, not broken functionality
- **Reference:** See `ARCHITECTURE-HISTORY.md` for complete migration details

## D-LDC-004: Comprehensive cleanup completed
- **Date:** 2026-01-25
- **Context:** 100+ obsolete files remained from FastAPI migration and deprecated APEX/WMACS systems
- **Decision:** Removed all obsolete code, scripts, and documentation; archived historical items
- **Consequences:** Repository is clean, well-documented, and ready for continued development
- **Details:** See `CLEANUP-COMPLETE-REPORT.md` for full cleanup summary

## D-LDC-005: Repository renamed to ldc-tools
- **Date:** 2026-01-25
- **Context:** Repository name "ldc-construction-tools" was verbose; "ldc-tools" is clearer and matches display name
- **Decision:** Renamed GitHub repo and updated all references in codebase
- **Scope:** 30 files updated (package.json, docs, scripts, workflows, configs)
- **Consequences:** 
  - GitHub repo: `heybearc/ldc-tools`
  - Package name: `ldc-tools-mcp`
  - Container paths: `/opt/ldc-tools/frontend`
  - Local directory rename pending (Phase 4)
- **Reference:** See `rename-checklist.md` for complete rename plan

## D-LDC-006: Feedback ID format matches TheoShift (FB-001)
- **Date:** 2026-02-15
- **Context:** D-024 policy requires user-facing feedback IDs; TheoShift uses FB-001 format
- **Decision:** Use FB-001, FB-002, etc. format for feedbackNumber field (not plain 001)
- **Consequences:** All 14 existing feedback items backfilled with FB-001 through FB-014; new feedback auto-increments
- **Reference:** Migration `20260215_add_feedback_number`, D-024 compliance complete

## D-LDC-007: Release notes redesigned with industry-standard UI
- **Date:** 2026-02-15
- **Context:** Original release notes page was huge scrolling wall of technical text; user feedback requested professional layout
- **Decision:** Implement sidebar navigation with collapsible version groups, simplified user-facing content
- **Pattern:** Sidebar groups (v1.20-1.27, v1.10-1.19, v1.0-1.9), single-version focus, removed technical details
- **Consequences:** All 36 release notes accessible, matches industry standards (Stripe, GitHub, Notion)
- **Reference:** Research documented in `docs/RELEASE-NOTES-RECOMMENDATIONS.md`

## D-LDC-008: LDC Tools release verification must use HAProxy routing as runtime truth
- **Date:** 2026-04-28
- **Context:** During v1.27.4 release, MCP deploy/sync operations succeeded but status reporting for ldc-tools intermittently returned `backend: unknown` and stale LIVE/STANDBY labels.
- **Decision:** Treat HAProxy config inspection (`use_backend ... if is_ldc`) as the authoritative runtime source before release/sync decisions whenever MCP status output is ambiguous.
- **Operational rule:** If MCP status and observed version differ, verify HAProxy first, then perform role-based action (LIVE/STANDBY), then re-verify versions on both nodes.
- **Naming standard:** Prefer `ldctools-blue` / `ldctools-green` aliases and avoid `prod/staging` language in deployment workflows.
