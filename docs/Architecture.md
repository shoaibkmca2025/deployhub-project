# Architecture

```mermaid
flowchart LR
  subgraph Web[Web (Vite + React)]
    UI[Dashboard UI]
  end
  subgraph Server[Server (Express + Socket.IO)]
    API[REST API]
    WS[WebSocket]
  end
  subgraph Agent[Agent (Node.js)]
    Runner[Clone/Build/Run]
  end

  UI -- REST --> API
  UI -- WS --> WS
  Agent -- WS --> WS
  API -- Webhook --> GH[(GitHub)]
```

Data
- Users (in-memory)
- Agents (online/offline, specs)
- Deployments (repo, status, logs, env)

Realtime
- WS: agents report status/logs; server broadcasts to UIs

CI/CD
- GitHub webhook → server triggers redeploy via WS to agent

