# LDC Tools Plan

**Last updated:** 2026-05-19  
**Current phase:** Release reliability hardening (post-v1.27.4)  
**Status:** MCP LIVE/STANDBY parsing fixed; Phase 4 planning next

---

## Current Phase

### Active Work
- [x] Fix MCP `get_deployment_status` parsing for ldc-tools (`backend: unknown` misreport) (effort: S)
- [ ] Validate end-to-end MCP release workflow against HAProxy truth source (effort: S)
- [ ] Plan Phase 4 features and timeline (effort: S)

### Completed This Phase
- ✅ Release v1.27.4 — bump, release tag, traffic switch, standby sync (2026-04-28)
- ✅ Feedback submission 500 fix — `feedbackNumber` on create (2026-04-28)
- ✅ qa-01 `/test-release` smoke 4/4 with `dotenv` fix (2026-04-28)
- ✅ MCP ldc-tools HAProxy ACL `is_ldc` + `resolveLiveNode` fallback (2026-05-19)

---

## Prioritized Backlog

### High Priority
- [ ] Rework admin portal to match TheoShift approach (effort: XL)
- [ ] Mobile optimization and PWA support (effort: L)
- [ ] Fix TypeScript error in ImportExportButtons.tsx (lines 52, 184) (effort: S)

### Medium Priority
- [ ] SSH alias configuration improvement — color-based naming (effort: S)
- [ ] Enhanced error messages across application (effort: M)
- [ ] Additional validation rules (effort: M)
- [ ] Resolve Playwright reporter output folder overlap warning on qa-01 (effort: S)

### Low Priority
- [ ] Performance optimizations for large datasets (effort: L)
- [ ] Improved caching strategies (effort: M)
- [ ] Code quality improvements — lint warnings, logging (effort: M)

---

## Known Issues

- TypeScript error in ImportExportButtons.tsx (lines 52, 184) — non-blocking
- Role code mismatch handling could be stricter (PC_SUPPORT vs PC-Support)
- FastAPI backend documentation debt — app is Next.js-only since v1.18.0

---

## Roadmap

### Phase 4: Role Management System
**Status:** Planned (4–6 weeks)  
**Objectives:**
- Role management system build-out
- Admin portal alignment with TheoShift patterns

### Q2 2026
- Email configuration (Gmail/SMTP)
- User invitation system
- Health monitoring dashboard
- API status monitor
- System operations / backup management

### Future
- Enhanced bulk import/export
- Advanced reporting and analytics
- External construction management integrations

---

## Notes

- Phases 1–3 complete (multi-tenant, CG management, admin module)
- Feedback FB-012, FB-014 resolved; no open NEW items as of 2026-04-28
- HAProxy ACL for production domain: `is_ldc` → `ldc-tools-blue` / `ldc-tools-green`
- Migrated from IMPLEMENTATION-PLAN.md per D-035 (2026-05-19)
