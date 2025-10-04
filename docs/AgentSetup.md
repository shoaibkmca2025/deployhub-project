# Agent Setup Guide

Prereqs: Node.js 18+

Windows (PowerShell):
- cd D:\\deployhub-project\\agent
- npm install
- $env:SERVER_URL='http://YOUR_SERVER:4000'; npm start

Linux/macOS:
- cd /path/to/deployhub-project/agent
- npm install
- SERVER_URL='http://YOUR_SERVER:4000' npm start

Agent env vars:
- SERVER_URL: server origin (e.g., http://localhost:4000)
- AGENT_NAME: optional friendly name
- AGENT_ID: optional fixed id

Troubleshooting:
- Check firewall allows outbound WebSocket to port 4000
- Ensure repo URLs are public or provide access

