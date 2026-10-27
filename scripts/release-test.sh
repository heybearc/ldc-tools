#!/usr/bin/env bash
# LDC Tools published release gate (D-066).
# A fixed behavioral set, plus the area the change touched.
# Page-load smoke is not the gate.
#
# Usage:
#   RELEASE_BASE_URL=http://10.92.3.25:3001 bash scripts/release-test.sh gate
#   BASE_REV=<sha> bash scripts/release-test.sh detect
# Areas: gate directory volunteers admin auth full

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"

GATE=(
  tests/release-gate/directory-overview.spec.ts
)

area_files() {
  case "$1" in
    gate) ;;
    directory) ;;
    volunteers)
      echo tests/volunteers.spec.ts
      ;;
    admin)
      echo tests/admin-functions.spec.ts
      ;;
    auth)
      echo tests/release-gate/auth.spec.ts
      ;;
    *)
      echo "Unknown area: $1" >&2
      echo "Areas: gate directory volunteers admin auth full" >&2
      exit 2
      ;;
  esac
}

detect_areas() {
  local rev="${BASE_REV:-}"
  local files areas=()
  if [ -z "$rev" ]; then
    echo gate
    return
  fi
  files="$(git -C "$ROOT" diff --name-only "${rev}..HEAD" || true)"
  if printf '%s\n' "$files" | grep -Eq 'prisma/schema\.prisma|prisma/migrations/|src/app/auth/|src/lib/auth|src/app/api/auth/|app/login/|lib/auth/|app/api/auth/'; then
    echo full
    return
  fi
  if printf '%s\n' "$files" | grep -Eq 'trade-teams/'; then
    areas+=(directory)
  fi
  if printf '%s\n' "$files" | grep -Eq 'volunteers/'; then
    areas+=(volunteers)
  fi
  if printf '%s\n' "$files" | grep -Eq '/admin/'; then
    areas+=(admin)
  fi
  if [ "${#areas[@]}" -eq 0 ]; then
    echo gate
  else
    echo "${areas[*]}"
  fi
}

if [ "${1:-}" = "detect" ]; then
  detect_areas
  exit 0
fi

if [ "$#" -eq 0 ]; then
  echo "Usage: scripts/release-test.sh <gate|directory|volunteers|admin|auth|full|detect>" >&2
  exit 2
fi

for area in "$@"; do
  if [ "$area" = "full" ]; then
    if [ "$#" -ne 1 ]; then
      echo "full runs alone" >&2
      exit 2
    fi
  else
    area_files "$area" >/dev/null
  fi
done

BASE_URL="${RELEASE_BASE_URL:-${BASE_URL:-}}"
if [ -z "$BASE_URL" ]; then
  echo "Set RELEASE_BASE_URL or BASE_URL to the STANDBY origin" >&2
  exit 2
fi
export BASE_URL

if [ ! -d node_modules/@playwright/test ]; then
  npm install
fi

if [ "$1" = "full" ]; then
  echo "LDC Tools release area: full"
  export CI="${CI:-1}"
  exec npm run test:e2e
fi

PATHS=("${GATE[@]}")
for area in "$@"; do
  if [ "$area" = "gate" ] || [ "$area" = "directory" ]; then
    continue
  fi
  while IFS= read -r file; do
    [ -n "$file" ] || continue
    PATHS+=("$file")
  done < <(area_files "$area")
done

MISSING=0
for file in "${PATHS[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Missing gate file: $file" >&2
    MISSING=1
  fi
done
if [ "$MISSING" -ne 0 ]; then
  exit 1
fi

echo "LDC Tools release area: $* (${#PATHS[@]} files, gate included)"
npx playwright test "${PATHS[@]}" --workers=1
