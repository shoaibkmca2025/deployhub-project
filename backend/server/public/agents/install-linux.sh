#!/usr/bin/env bash
set -euo pipefail
SERVER_URL=${1:-https://deployhub-backend.onrender.com}
echo "Installing DeployHub Agent..."
echo "Connecting to server: $SERVER_URL"
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
cd "$SCRIPT_DIR/../../../agent"
npm install
export SERVER_URL="$SERVER_URL"
export AGENT_NAME="Linux-Agent-$(hostname)"
echo "Starting agent with name: $AGENT_NAME"
npm start

