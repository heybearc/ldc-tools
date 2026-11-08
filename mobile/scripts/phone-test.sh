#!/bin/sh
# Run the phone app on this Mac and walk the feature screens.
# iOS Simulator cannot run in a Linux container. Android uses the SDK already on this Mac.
# qa-01 still checks the phone API. It does not drive the phone screen.
#
# Usage, from mobile/:
#   npm run test:phone
#   npm run test:phone -- android
#
# Credentials: mobile/.env.test (see .env.test.example), else frontend/.env.test.
# PHONE_API_BASE must be the current STANDBY origin.

set -eu

cd "$(dirname "$0")/.."
PLATFORM="${1:-ios}"

if [ -f .env.test ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.test
  set +a
elif [ -f ../frontend/.env.test ]; then
  set -a
  # shellcheck disable=SC1091
  . ../frontend/.env.test
  set +a
fi

EMAIL="${TEST_USER_EMAIL:-${EMAIL:-}}"
PASSWORD="${TEST_USER_PASSWORD:-${PASSWORD:-}}"
API_BASE="${PHONE_API_BASE:-}"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
  echo "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in mobile/.env.test" >&2
  exit 1
fi

if [ -z "$API_BASE" ]; then
  echo "Set PHONE_API_BASE to the current STANDBY URL, for example https://green.ldctools.com" >&2
  exit 1
fi

case "$API_BASE" in
  https://ldctools.com|https://ldctools.com/)
    echo "PHONE_API_BASE points at the public site. Use the standby color host." >&2
    exit 1
    ;;
esac

if [ -z "${JAVA_HOME:-}" ] && [ -x /opt/homebrew/opt/openjdk@17/bin/java ]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true
export PATH="$HOME/.maestro/bin:$PATH"
if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro is not installed. Install it on this Mac with:" >&2
  echo "  curl -Ls https://get.maestro.mobile.dev | bash" >&2
  exit 1
fi

export EXPO_PUBLIC_API_BASE="$API_BASE"

case "$PLATFORM" in
  ios)
    if ! command -v xcrun >/dev/null 2>&1; then
      echo "Xcode is required for the iOS Simulator." >&2
      exit 1
    fi
    if ! xcrun simctl list runtimes | grep -q "iOS"; then
      echo "The iOS Simulator runtime is not installed. On this Mac run:" >&2
      echo "  xcodebuild -downloadPlatform iOS" >&2
      exit 1
    fi
    npx expo run:ios
    ;;
  android)
    if [ -z "${ANDROID_HOME:-}" ] && [ -d "$HOME/Library/Android/sdk" ]; then
      export ANDROID_HOME="$HOME/Library/Android/sdk"
    fi
    npx expo run:android
    ;;
  *)
    echo "Use ios or android." >&2
    exit 1
    ;;
esac

exec maestro test -e EMAIL="$EMAIL" -e PASSWORD="$PASSWORD" .maestro/features.yaml
