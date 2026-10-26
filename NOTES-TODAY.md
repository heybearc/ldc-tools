---
date: 2026-10-26
purpose: Scratchpad for today's discoveries (promote on /end-day)
---

## Today

### Focus
- Resume ldc-tools from Level B archive → fully operational

### Discoveries / Notes
- CT133 lives on **prox2**, CT135 on **prox1** — `pct start` on prox1 fails for 133
- Postgres keepalived VIP **10.92.3.23** (D-061) collided with historical LDC blue IP → moved blue to **10.92.3.34** (D-068)
- HAProxy had bug: `is_ldc_green` routed to blue backend — fixed
- STANDBY deploy to green succeeded

### Decisions to Promote
- D-068 recorded in Cloudy-Work DECISIONS.md

### Blockers / Risks
- Re-enable Uptime Kuma monitors (manual)
- Cursor MCP may need reload to show blueIp 10.92.3.34 in get_deployment_status

### Links / Commands
- STANDBY: http://10.92.3.25:3001
- LIVE (blue): http://10.92.3.34:3001 / https://ldctools.com
