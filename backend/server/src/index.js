import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
       'http://localhost:3000', 
        'http://localhost:5173', 
        "https://deployhub-frontend.onrender.com"
      ] 
    : [
        'http://localhost:3000', 
        'http://localhost:5173', 
       "https://deployhub-frontend.onrender.com"
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static downloads (agent scripts)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          "https://deployhub-frontend.onrender.com"
        ] 
      : [
          'http://localhost:3000', 
          'http://localhost:5173', 
         "https://deployhub-frontend.onrender.com"
        ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Enhanced in-memory state with persistence
const agents = new Map(); // agentId -> { id, name, status, lastSeen, specs, socketId, createdAt }
const deployments = new Map(); // deploymentId -> { id, agentId, repoUrl, status, logs: [], name, env: {}, createdAt, updatedAt }
const users = new Map(); // userId -> { id, email, password, createdAt }
const tokens = new Map(); // token -> { userId, createdAt, expiresAt }
const deploymentLinks = new Map(); // linkId -> { repoUrl, branch, buildCommand, startCommand, env, timestamp }

// Add cleanup for expired tokens and deployment links
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tokens.entries()) {
    if (data.expiresAt && data.expiresAt < now) {
      tokens.delete(token);
    }
  }
  
  // Clean up expired deployment links (24 hours)
  for (const [linkId, config] of deploymentLinks.entries()) {
    if (now - config.timestamp > 24 * 60 * 60 * 1000) {
      deploymentLinks.delete(linkId);
    }
  }
}, 60000); // Clean up every minute

function getAgentsPublic() {
  return Array.from(agents.values()).map(a => ({
    id: a.id,
    name: a.name,
    status: a.status,
    lastSeen: a.lastSeen,
    specs: a.specs,
    createdAt: a.createdAt
  }));
}

// Enhanced error handling middleware
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
}

// Request validation middleware
function validateRequest(requiredFields) {
  return (req, res, next) => {
    const missing = requiredFields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missing 
      });
    }
    next();
  };
}

// REST API
app.get('/', (req, res) => {
  res.send('DeployHub server OK');
});

// --- Enhanced Auth ---
app.post('/api/signup', validateRequest(['email', 'password']), (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const exists = Array.from(users.values()).find(u => u.email === email);
    if (exists) return res.status(409).json({ error: 'Email already exists' });
    
    const id = uuidv4();
    const now = Date.now();
    users.set(id, { id, email, password, createdAt: now });
    
    const token = uuidv4();
    tokens.set(token, { 
      userId: id, 
      createdAt: now, 
      expiresAt: now + (24 * 60 * 60 * 1000) // 24 hours
    });
    
    res.json({ 
      token, 
      user: { id, email },
      expiresIn: 24 * 60 * 60 * 1000
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/login', validateRequest(['email', 'password']), (req, res) => {
  try {
    const { email, password } = req.body;
    const user = Array.from(users.values()).find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = uuidv4();
    const now = Date.now();
    tokens.set(token, { 
      userId: user.id, 
      createdAt: now, 
      expiresAt: now + (24 * 60 * 60 * 1000) // 24 hours
    });
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email },
      expiresIn: 24 * 60 * 60 * 1000
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

function requireAuth(req, res, next) {
  try {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const tokenData = tokens.get(token);
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Check if token is expired
    if (tokenData.expiresAt && tokenData.expiresAt < Date.now()) {
      tokens.delete(token);
      return res.status(401).json({ error: 'Token expired' });
    }
    
    req.userId = tokenData.userId;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

app.get('/api/agents', (req, res) => {
  res.json({ agents: getAgentsPublic() });
});

// Public health check for agents
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online',
    agents: agents.size,
    deployments: deployments.size,
    timestamp: new Date().toISOString()
  });
});

// Generate deployment link
app.post('/api/generate-link', (req, res) => {
  try {
    const { repoUrl, branch = 'main', buildCommand, startCommand, env = {} } = req.body;
    
    // Validate repository URL
    const repoUrlRegex = /^https?:\/\/github\.com\/[^\/]+\/[^\/]+(\.git)?$/;
    if (!repoUrlRegex.test(repoUrl)) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL' });
    }
    
    // Create a deployment configuration object
    const deploymentConfig = {
      repoUrl,
      branch,
      buildCommand: buildCommand || 'npm install',
      startCommand: startCommand || 'npm start',
      env,
      timestamp: Date.now()
    };
    
    // Generate a unique link ID
    const linkId = uuidv4();
    
    // Store the configuration
    deploymentLinks.set(linkId, deploymentConfig);
    
    // Generate the deployment URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const deploymentUrl = `${baseUrl}/deploy/${linkId}`;
    
    res.json({ 
      linkId,
      deploymentUrl,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });
  } catch (error) {
    console.error('Generate link error:', error);
    res.status(500).json({ error: 'Failed to generate deployment link' });
  }
});

// Get deployment configuration from link
app.get('/api/deploy/:linkId', (req, res) => {
  try {
    const { linkId } = req.params;
    
    // Retrieve configuration
    const config = deploymentLinks.get(linkId);
    
    if (!config) {
      return res.status(404).json({ error: 'Deployment link not found or expired' });
    }
    
    // Check if link is expired (24 hours)
    if (Date.now() - config.timestamp > 24 * 60 * 60 * 1000) {
      deploymentLinks.delete(linkId);
      return res.status(410).json({ error: 'Deployment link has expired' });
    }
    
    res.json({ 
      config,
      agents: getAgentsPublic()
    });
  } catch (error) {
    console.error('Get deployment config error:', error);
    res.status(500).json({ error: 'Failed to get deployment configuration' });
  }
});

app.get('/api/deployments', (req, res) => {
  res.json({ deployments: Array.from(deployments.values()) });
});

app.post('/api/deploy', requireAuth, validateRequest(['agentId', 'repoUrl']), (req, res) => {
  try {
    const { agentId, repoUrl, branch = 'main', buildCommand, startCommand, env = {} } = req.body;
    
    // Validate repository URL
    const repoUrlRegex = /^https?:\/\/github\.com\/[^\/]+\/[^\/]+(\.git)?$/;
    if (!repoUrlRegex.test(repoUrl)) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL' });
    }
    
    const agent = agents.get(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found or offline' });
    }
    
    if (agent.status !== 'online') {
      return res.status(400).json({ error: 'Agent is offline' });
    }
    
    const deploymentId = uuidv4();
    const now = Date.now();
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'app';
    
    const deployment = {
      id: deploymentId,
      agentId,
      repoUrl,
      branch,
      status: 'queued',
      logs: [`[${new Date().toISOString()}] Deployment queued`],
      name: repoName,
      env,
      buildCommand: buildCommand || 'npm install',
      startCommand: startCommand || 'npm start',
      createdAt: now,
      updatedAt: now,
      userId: req.userId
    };
    
    deployments.set(deploymentId, deployment);

    // Send deploy command to agent
    io.to(agent.socketId).emit('agent:deploy', { 
      deploymentId, 
      repoUrl, 
      branch, 
      buildCommand: deployment.buildCommand,
      startCommand: deployment.startCommand,
      env: deployment.env
    });
    
    deployment.status = 'running';
    deployment.logs.push(`[${new Date().toISOString()}] Deployment started on agent: ${agent.name}`);
    
    // Notify dashboard clients
    io.emit('dashboard:deployment-status', { 
      deploymentId, 
      status: 'running',
      deployment: {
        id: deploymentId,
        name: deployment.name,
        status: 'running',
        agentId: agentId
      }
    });
    
    res.json({ deployment });
  } catch (error) {
    console.error('Deploy error:', error);
    res.status(500).json({ error: 'Failed to start deployment' });
  }
});

// Update env vars
app.put('/api/deployments/:id/env', requireAuth, (req, res) => {
  const dep = deployments.get(req.params.id);
  if (!dep) return res.status(404).json({ error: 'not found' });
  dep.env = req.body?.env || {};
  res.json({ deployment: dep });
});

// Start/Stop/Restart
app.post('/api/deployments/:id/action', requireAuth, (req, res) => {
  const dep = deployments.get(req.params.id);
  if (!dep) return res.status(404).json({ error: 'not found' });
  const agent = agents.get(dep.agentId);
  if (!agent) return res.status(400).json({ error: 'agent offline' });
  const action = (req.body?.action || '').toLowerCase();
  if (!['start','stop','restart'].includes(action)) return res.status(400).json({ error: 'invalid action' });
  io.to(agent.socketId).emit(`agent:${action}`, { deploymentId: dep.id });
  dep.logs.push(`[server] ${action} requested`);
  res.json({ ok: true });
});

// Delete deployment
app.delete('/api/deployments/:id', requireAuth, (req, res) => {
  const dep = deployments.get(req.params.id);
  if (!dep) return res.status(404).json({ error: 'not found' });
  const agent = agents.get(dep.agentId);
  if (agent) io.to(agent.socketId).emit('agent:stop', { deploymentId: dep.id });
  deployments.delete(dep.id);
  io.emit('dashboard:deployment-status', { deploymentId: dep.id, status: 'deleted' });
  res.json({ ok: true });
});

// Simple GitHub webhook placeholder (no validation in MVP)
app.post('/webhooks/github', (req, res) => {
  const event = req.headers['x-github-event'];
  const repoUrl = req.body?.repository?.html_url;
  if (event === 'push' && repoUrl) {
    for (const dep of deployments.values()) {
      if (dep.repoUrl === repoUrl) {
        const agent = agents.get(dep.agentId);
        if (agent) {
          io.to(agent.socketId).emit('agent:deploy', { deploymentId: dep.id, repoUrl: dep.repoUrl });
          dep.status = 'running';
          dep.logs.push(`[webhook] Redeploy triggered`);
        }
      }
    }
  }
  res.json({ ok: true });
});

// AI suggester (very basic heuristic)
app.post('/api/ai/suggest', (req, res) => {
  const { repoUrl, files = [] } = req.body || {};
  const lower = String(repoUrl || '').toLowerCase();
  let result = { runtime: 'node', build: 'npm install', start: 'npm start', port: 3000, env: { NODE_ENV: 'production' } };
  if (lower.endsWith('.git') || lower.includes('github')) {
    if (files.includes('index.html')) {
      result = { runtime: 'static', build: '', start: 'serve ./', port: 8080, env: {} };
    }
  }
  res.json({ suggestion: result });
});

// Socket.IO for agents and dashboards
io.on('connection', (socket) => {
  const kind = socket.handshake.query.kind; // 'agent' or 'dashboard'

  if (kind === 'agent') {
    const agentName = socket.handshake.query.name || `agent-${socket.id.slice(0,6)}`;
    const agentId = socket.handshake.query.agentId || uuidv4();
    agents.set(agentId, {
      id: agentId,
      name: agentName,
      status: 'online',
      lastSeen: Date.now(),
      specs: {},
      socketId: socket.id
    });

    io.emit('dashboard:agents', getAgentsPublic());

    socket.on('agent:status', (payload) => {
      const a = agents.get(agentId);
      if (a) {
        a.lastSeen = Date.now();
        a.status = 'online';
        a.specs = payload?.specs || a.specs;
        io.emit('dashboard:agents', getAgentsPublic());
      }
    });

    socket.on('agent:log', ({ deploymentId, line }) => {
      const dep = deployments.get(deploymentId);
      if (dep) {
        dep.logs.push(line);
        io.emit('dashboard:deployment-log', { deploymentId, line });
      }
    });

    socket.on('agent:deployment-status', ({ deploymentId, status }) => {
      const dep = deployments.get(deploymentId);
      if (dep) {
        dep.status = status;
        io.emit('dashboard:deployment-status', { deploymentId, status });
      }
    });

    socket.on('disconnect', () => {
      const a = agents.get(agentId);
      if (a) {
        a.status = 'offline';
        a.socketId = null;
        io.emit('dashboard:agents', getAgentsPublic());
      }
    });
  } else {
    // dashboard client
    socket.emit('dashboard:agents', getAgentsPublic());
  }
});

// Add error handling middleware
app.use(errorHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    agents: agents.size,
    deployments: deployments.size,
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 DeployHub server listening on http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Network access: http://10.136.64.168:${PORT}`);
});


