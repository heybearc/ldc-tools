# LDC Tools release testing

Published gate for D-066. qa-01 runs `scripts/release-test.sh` from the repo root instead of the full Playwright suite.

## What each release runs

A fixed gate, plus the area the change touched, plus any generated test for that release.

| Area | What it covers |
|------|----------------|
| `gate` | Sign in, then the trade-team directory returns teams and people, the role table has TTO through TC Support, a headshot renders when the API sent one, and CSV export includes those columns |
| `directory` | Same checks as `gate`. Used when the diff touches `trade-teams/` |
| `volunteers` | Gate plus the volunteer contact suite |
| `admin` | Gate plus admin import, export, and add-person controls |
| `auth` | Gate plus a rejected sign-in staying on the sign-in page with the invalid-credentials message |
| `full` | The complete Playwright suite |

Login, sign-in, and database schema changes run `full`. Everything else runs `gate` alone when no area matches.

Page-load smoke is not this gate.

## Run it

```bash
RELEASE_BASE_URL=http://10.92.3.25:3001 bash scripts/release-test.sh gate
BASE_REV=<previous-tag> bash scripts/release-test.sh detect
```

`RELEASE_BASE_URL` is the current STANDBY origin. After a traffic switch, use the color that is not serving https://ldctools.com.

Credentials come from `frontend/.env.test` (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`) on qa-01. Do not commit that file.
