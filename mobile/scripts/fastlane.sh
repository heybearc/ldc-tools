#!/bin/sh
set -eu

if [ -x /opt/homebrew/opt/ruby/bin/ruby ]; then
  export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
fi

if [ -z "${JAVA_HOME:-}" ] && [ -x /opt/homebrew/opt/openjdk@17/bin/java ]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
fi

if [ -z "${ANDROID_HOME:-}" ] && [ -d "$HOME/Library/Android/sdk" ]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
fi

if [ -n "${JAVA_HOME:-}" ]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi

cd "$(dirname "$0")/.."
# A previous archive can leave ibtoold running with its FIFOs. Clear those
# leftovers before this lane starts.
killall -9 actool ibtoold AssetCatalogAgent AssetCatalogSimulatorAgent >/dev/null 2>&1 || true
if [ -n "${TMPDIR:-}" ]; then
  find "$TMPDIR" -maxdepth 1 \( -name 'ibtoold-*' -o -name 'ib*-IBTOOLD-*' \) -exec rm -rf {} + || true
fi
# Xcode 27 can leave actool stuck. The watcher only recycles a compile that
# has not finished. It must not open the asset-catalog FIFOs; that makes
# AssetCatalogAgent abort before the handshake.
python3 scripts/hold-asset-catalog-pipes.py >/tmp/ldc-asset-catalog-pipes.log 2>&1 &
watcher=$!
cleanup() {
  kill "$watcher" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
set +e
bundle exec fastlane "$@"
status=$?
set -e
exit "$status"
