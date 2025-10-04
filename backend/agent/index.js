import os from 'os';
import { io } from 'socket.io-client';
import { tmpdir } from 'os';
import { mkdtempSync, existsSync, rmSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import simpleGit from 'simple-git';

const execAsync = promisify(exec);

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';
const AGENT_NAME = process.env.AGENT_NAME || os.hostname();
const AGENT_ID = process.env.AGENT_ID || '';

// Enhanced logging
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);
  if (data) console.log(JSON.stringify(data, null, 2));
}

const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  query: { kind: 'agent', name: AGENT_NAME, agentId: AGENT_ID },
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000
});

socket.on('connect', () => {
  log('info', `Connected to ${SERVER_URL}`);
  reportStatus();
});

socket.on('disconnect', (reason) => {
  log('warn', `Disconnected from server: ${reason}`);
});

socket.on('connect_error', (error) => {
  log('error', `Connection error: ${error.message}`);
});

socket.on('reconnect', (attemptNumber) => {
  log('info', `Reconnected after ${attemptNumber} attempts`);
});

function reportStatus() {
  try {
    const freeMemMb = Math.round(os.freemem() / 1024 / 1024);
    const totalMemMb = Math.round(os.totalmem() / 1024 / 1024);
    const load = os.loadavg?.()[0] || 0;
    const cpus = os.cpus();
    
    socket.emit('agent:status', {
      specs: {
        platform: os.platform(),
        arch: os.arch(),
        cpuCount: cpus?.length || 0,
        load1m: Number(load.toFixed(2)),
        memory: { 
          freeMb: freeMemMb, 
          totalMb: totalMemMb,
          usedMb: totalMemMb - freeMemMb,
          usagePercent: Math.round(((totalMemMb - freeMemMb) / totalMemMb) * 100)
        },
        uptime: Math.round(os.uptime()),
        hostname: os.hostname(),
        nodeVersion: process.version,
        agentVersion: '1.0.0'
      }
    });
  } catch (error) {
    log('error', 'Failed to report status', error);
  }
}

// Report status every 5 seconds
setInterval(reportStatus, 5000);
reportStatus();

async function runDeploy({ deploymentId, repoUrl, branch = 'main', buildCommand, startCommand, env = {} }) {
  const workDir = mkdtempSync(path.join(tmpdir(), 'deployhub-'));
  const git = simpleGit({ baseDir: workDir });
  
  try {
    log('info', `Starting deployment ${deploymentId}`, { repoUrl, branch, workDir });
    socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Starting deployment...` });
    socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Cloning ${repoUrl} (branch: ${branch})...` });
    
    // Clone repository
    await git.clone(repoUrl, workDir, ['--branch', branch, '--depth', '1']);
    socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Repository cloned successfully` });
    
    // Write environment variables
    if (Object.keys(env).length > 0) {
      const envContent = Object.entries(env)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      writeFileSync(path.join(workDir, '.env'), envContent);
      socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Environment variables written` });
    }
    
    // Detect project type and run appropriate commands
    const packageJsonPath = path.join(workDir, 'package.json');
    const requirementsPath = path.join(workDir, 'requirements.txt');
    const dockerfilePath = path.join(workDir, 'Dockerfile');
    
    let detectedType = 'unknown';
    if (existsSync(packageJsonPath)) {
      detectedType = 'node';
    } else if (existsSync(requirementsPath)) {
      detectedType = 'python';
    } else if (existsSync(dockerfilePath)) {
      detectedType = 'docker';
    }
    
    socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Detected project type: ${detectedType}` });
    
    // Run build command
    if (buildCommand) {
      socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Running build command: ${buildCommand}` });
      try {
        const { stdout, stderr } = await execAsync(buildCommand, { 
          cwd: workDir, 
          env: { ...process.env, ...env },
          timeout: 300000 // 5 minutes timeout
        });
        
        if (stdout) {
          socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Build output: ${stdout}` });
        }
        if (stderr) {
          socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Build warnings: ${stderr}` });
        }
        
        socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Build completed successfully` });
      } catch (buildError) {
        socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Build failed: ${buildError.message}` });
        throw buildError;
      }
    }
    
    // Simulate start command (in real implementation, this would start the service)
    if (startCommand) {
      socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Start command: ${startCommand}` });
      socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Service would be started with: ${startCommand}` });
    }
    
    socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Deployment completed successfully` });
    socket.emit('agent:deployment-status', { deploymentId, status: 'succeeded' });
    
    log('info', `Deployment ${deploymentId} completed successfully`);
    
  } catch (error) {
    log('error', `Deployment ${deploymentId} failed`, error);
    socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Deployment failed: ${error.message}` });
    socket.emit('agent:deployment-status', { deploymentId, status: 'failed' });
  } finally {
    // Cleanup after a delay to allow logs to be sent
    setTimeout(() => {
      safeCleanup(workDir);
    }, 1000);
  }
}

function safeCleanup(dir) {
  try {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
      log('info', `Cleaned up directory: ${dir}`);
    }
  } catch (error) {
    log('warn', `Failed to cleanup directory ${dir}`, error);
  }
}

function sleep(ms) { 
  return new Promise(r => setTimeout(r, ms)); 
}

// Store active deployments
const activeDeployments = new Map();

socket.on('agent:deploy', (payload) => {
  log('info', 'Received deploy command', payload);
  activeDeployments.set(payload.deploymentId, payload);
  runDeploy(payload);
});

socket.on('agent:start', ({ deploymentId }) => {
  log('info', `Start command received for deployment ${deploymentId}`);
  socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Start command received` });
  socket.emit('agent:deployment-status', { deploymentId, status: 'running' });
});

socket.on('agent:stop', ({ deploymentId }) => {
  log('info', `Stop command received for deployment ${deploymentId}`);
  socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Stop command received` });
  socket.emit('agent:deployment-status', { deploymentId, status: 'stopped' });
  activeDeployments.delete(deploymentId);
});

socket.on('agent:restart', ({ deploymentId }) => {
  log('info', `Restart command received for deployment ${deploymentId}`);
  socket.emit('agent:log', { deploymentId, line: `[${new Date().toISOString()}] [agent] Restart command received` });
  socket.emit('agent:deployment-status', { deploymentId, status: 'running' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('info', 'SIGTERM received, shutting down gracefully');
  socket.disconnect();
  process.exit(0);
});

process.on('SIGINT', () => {
  log('info', 'SIGINT received, shutting down gracefully');
  socket.disconnect();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log('error', 'Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Unhandled Rejection', { reason, promise });
});


