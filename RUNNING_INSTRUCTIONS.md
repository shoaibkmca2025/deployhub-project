# DeployHub Project - Step-by-Step Running Instructions

## 🚀 Method 1: Using the Startup Script (Easiest)

### Step 1: Run the Startup Script
```bash
# Double-click this file in File Explorer:
start-deployhub.bat

# OR run from terminal:
.\start-deployhub.bat
```

This will automatically:
- Stop any running Node processes
- Start the backend server
- Start the frontend server
- Open the application in your browser

---

## 🛠️ Method 2: Manual Setup (Step-by-Step)

### Prerequisites
- Node.js installed (version 18+)
- npm installed

### Step 1: Install Dependencies
```powershell
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..\frontend
npm install
```

### Step 2: Start Backend Server
```powershell
# Open Terminal/Command Prompt
cd backend
npm run server:dev
```

**Expected Output:**
```
🚀 DeployHub server listening on http://0.0.0.0:4000
📊 Health check: http://localhost:4000/health
🔧 Environment: development
```

### Step 3: Start Frontend Server (New Terminal)
```powershell
# Open a NEW Terminal/Command Prompt
cd frontend
npm run web:dev
```

**Expected Output:**
```
  VITE v5.4.20  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://10.136.64.168:5173/
  ➜  press h to show help
```

### Step 4: Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000

---

## 🐳 Method 3: Using Docker (If Available)

### Prerequisites
- Docker Desktop installed
- Docker Compose available

### Step 1: Start with Docker
```powershell
# Development environment
docker-compose -f docker-compose.dev.yml up --build

# OR production environment
docker-compose up --build
```

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "docker-compose is not recognized"
**Solution:** Install Docker Desktop or use Method 2 (Manual Setup)

### Issue 2: PowerShell Syntax Errors
**Solution:** Use separate commands instead of `&&`:
```powershell
# Instead of: cd backend && npm run server:dev
# Use:
cd backend
npm run server:dev
```

### Issue 3: Port Already in Use
**Solution:** Stop existing processes:
```powershell
# Stop all Node processes
taskkill /f /im node.exe

# Or find and kill specific process
netstat -ano | findstr ":4000"
taskkill /f /pid [PID_NUMBER]
```

### Issue 4: Dependencies Not Installed
**Solution:** Install all dependencies:
```powershell
# From project root
npm run install-all
```

---

## 📋 Verification Steps

### Step 1: Check Backend is Running
```powershell
# Test API endpoint
Invoke-WebRequest -Uri "http://localhost:4000/api/status"
```

**Expected Response:**
```json
{
  "status": "online",
  "agents": 0,
  "deployments": 0,
  "timestamp": "2025-01-04T..."
}
```

### Step 2: Check Frontend is Running
- Open browser to http://localhost:5173
- Should see DeployHub signup/login page

### Step 3: Test Signup
- Enter email and password
- Click "Create Account"
- Should redirect to dashboard (no "Failed to fetch" error)

---

## 🎯 Quick Commands Reference

```powershell
# Start everything (if startup script doesn't work)
cd backend; npm run server:dev
# Then in new terminal:
cd frontend; npm run web:dev

# Stop all services
taskkill /f /im node.exe

# Install all dependencies
npm run install-all

# Test API
curl http://localhost:4000/api/status
```

---

## 🌐 Service URLs Summary

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Main application |
| Backend API | http://localhost:4000 | API server |
| Health Check | http://localhost:4000/health | Server status |
| API Status | http://localhost:4000/api/status | API status |

---

## ✅ Success Indicators

- ✅ Backend shows "DeployHub server listening on http://0.0.0.0:4000"
- ✅ Frontend shows "Local: http://localhost:5173/"
- ✅ Browser opens to DeployHub signup page
- ✅ Signup form works without errors
- ✅ User gets redirected to dashboard after signup

