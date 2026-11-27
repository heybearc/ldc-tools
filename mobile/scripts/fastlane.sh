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
# Xcode rejects a script as ASSETCATALOG_EXEC. The binary forwards version
# probes to actool and catalog compiles to the retry helper beside it.
clang -O2 -o scripts/actool scripts/actool-isolated.c
# A previous archive can leave ibtoold running with its FIFOs. Clear those
# leftovers before this lane starts.
killall -9 actool ibtoold AssetCatalogAgent AssetCatalogSimulatorAgent >/dev/null 2>&1 || true
if [ -n "${TMPDIR:-}" ]; then
  find "$TMPDIR" -maxdepth 1 \( -name 'ibtoold-*' -o -name 'ib*-IBTOOLD-*' \) -exec rm -rf {} + || true
fi
set +e
bundle exec fastlane "$@"
status=$?
set -e
exit "$status"
