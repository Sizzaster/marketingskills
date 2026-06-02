#!/bin/bash
# setup-darren-cron.sh — Install Darren's daily MAIT pull as a macOS launchd job
#
# Usage:
#   ./setup-darren-cron.sh          # Install the daily job
#   ./setup-darren-cron.sh remove   # Uninstall the daily job
#   ./setup-darren-cron.sh test     # Run the pull once right now

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PLIST_NAME="com.heavenlyheat.darren-mait"
PLIST_SRC="$SCRIPT_DIR/$PLIST_NAME.plist"
PLIST_DST="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"
ENV_FILE="$REPO_DIR/.env"

# Check prerequisites
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found."
  echo "Copy .env.example to .env and fill in your API tokens."
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not found. Install Node 18+ first."
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "ERROR: Node 18+ required, found Node $NODE_VERSION"
  exit 1
fi

case "${1:-install}" in
  install)
    echo "=== Installing Darren's MAIT cron job ==="
    echo ""

    # Unload if already running
    launchctl list | grep -q "$PLIST_NAME" && launchctl unload "$PLIST_DST" 2>/dev/null || true

    # Copy plist to LaunchAgents
    cp "$PLIST_SRC" "$PLIST_DST"
    echo "Copied plist to $PLIST_DST"

    # Load the job
    launchctl load "$PLIST_DST"
    echo "Loaded launchd job: $PLIST_NAME"
    echo ""
    echo "Darren will run daily at 04:00 local time."
    echo "Logs: /tmp/darren-mait.log"
    echo ""
    echo "To test right now:  $0 test"
    echo "To remove:          $0 remove"
    ;;

  remove)
    echo "=== Removing Darren's MAIT cron job ==="
    launchctl unload "$PLIST_DST" 2>/dev/null || true
    rm -f "$PLIST_DST"
    echo "Removed $PLIST_DST"
    ;;

  test)
    echo "=== Running Darren's MAIT pull now (test) ==="
    echo ""
    source "$ENV_FILE"
    cd "$REPO_DIR"
    bash "$SCRIPT_DIR/mait-pull.sh"
    ;;

  *)
    echo "Usage: $0 [install|remove|test]"
    exit 1
    ;;
esac
