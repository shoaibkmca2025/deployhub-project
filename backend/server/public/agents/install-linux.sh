#!/usr/bin/env bash
set -euo pipefail
SERVER_URL=${1:-http://localhost:4000}
echo "Installing DeployHub Agent..."
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
cd "$SCRIPT_DIR/../../../agent"
npm install
SERVER_URL="$SERVER_URL" npm start

