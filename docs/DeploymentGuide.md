# Deployment Guide

1) Start the platform
- Server: `cd server && npm install && npm start`
- Agent: `cd agent && npm install && $env:SERVER_URL='http://localhost:4000'; npm start`
- Web: `cd web && npm install && npm run dev`

2) Sign up and login
- Open the web app, create an account, then login

3) Manual deploy from GitHub
- Paste repo URL (public) and click Deploy next to an online agent
- Watch build/start logs in real-time

4) Auto-redeploy on push
- GitHub → Settings → Webhooks → Add webhook
  - Payload URL: `http://YOUR_SERVER:4000/webhooks/github`
  - Content type: `application/json`
  - Events: `Just the push event`

5) Manage the app
- Start / Stop / Restart
- Edit environment variables (Env button)
- Delete deployment

