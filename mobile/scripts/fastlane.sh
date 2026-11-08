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
exec bundle exec fastlane "$@"
