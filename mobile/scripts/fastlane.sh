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
# Xcode 27 can deadlock actool against ibtoold. The watcher unblocks the
# handshake and kills a stuck actool so the lane can retry the archive.
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
