# LDC Tools Task State

**Last updated:** 2026-10-26  
**Current branch:** main  
**Working on:** Post-resume operationalization (D-056 reverse + D-068)

---

## Current Task
**Fleet resume complete — validate STANDBY deploy + smoke** - IN PROGRESS

### What I'm doing right now
Brought ldc-tools back from Level B archive: CTs running, HAProxy fixed, blue IP moved to 10.92.3.34, DB on Postgres VIP 10.92.3.23.

### Recent completions
- ✅ GitHub unarchived (`heybearc/ldc-tools`)
- ✅ CT133 (prox2) + CT135 (prox1) started; onboot enabled
- ✅ Blue IP conflict resolved: CT133 → `10.92.3.34` (D-068); Postgres VIP kept `.23`
- ✅ HAProxy blue server + green ACL routing fixed; vzdump restored; watchdog archive cleared
- ✅ Both nodes PM2 online; health `/api/auth/providers` → 200
- ✅ DATABASE_URL on both nodes → `10.92.3.23`

### Exact Next Command
1. MCP `deploy_to_standby` for `ldc-tools` (`pullGithub: true`)
2. Smoke on STANDBY (green)
3. Re-enable Uptime Kuma monitors for ldctools.com
4. Operator: expire Alertmanager silences for ldc instances if still active

---

## Known Issues
- TypeScript error in `ImportExportButtons.tsx` (lines 52, 184) — deferred
- Cursor MCP process may need reload to pick up `blueIp` 10.92.3.34

---

## Exact Next Command
`deploy_to_standby` app=ldc-tools pullGithub=true createBackup=true
