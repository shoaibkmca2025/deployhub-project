// server-agent-start.js
// Custom script to start both server and agent processes for Render deployment
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting DeployHub server and agent...');

// Start the server process
const serverProcess = spawn('node', ['./server/src/index.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

console.log('Server process started with PID:', serverProcess.pid);

// Start the agent process
const agentProcess = spawn('node', ['./agent/index.js'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    SERVER_URL: process.env.SERVER_URL || 'http://localhost:4000',
    AGENT_NAME: process.env.AGENT_NAME || 'render-agent'
  }
});

console.log('Agent process started with PID:', agentProcess.pid);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down server and agent...');
  serverProcess.kill();
  agentProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down server and agent...');
  serverProcess.kill();
  agentProcess.kill();
  process.exit(0);
});

// Handle child process exit
serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  if (code !== 0 && !process.exitCode) {
    process.exit(code);
  }
});

agentProcess.on('exit', (code) => {
  console.log(`Agent process exited with code ${code}`);
  if (code !== 0 && !process.exitCode) {
    process.exit(code);
  }
});

console.log('DeployHub server and agent are now running');