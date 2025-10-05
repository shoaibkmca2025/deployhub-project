#!/bin/bash
# Simple script to start both server and agent processes

echo "Starting DeployHub server and agent..."

# Start the server in the background
cd server && npm start &
SERVER_PID=$!
echo "Server process started with PID: $SERVER_PID"

# Wait a moment for the server to initialize
sleep 5

# Start the agent
cd ../agent && npm start &
AGENT_PID=$!
echo "Agent process started with PID: $AGENT_PID"

# Keep the script running to maintain the processes
echo "DeployHub server and agent are now running"
wait